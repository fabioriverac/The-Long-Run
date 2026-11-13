import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GymContext } from "./gym-context.js";
import { createIndexedDbStorage } from "./data/indexedDbStorage.js";
import { createRepository } from "./data/repository.js";
import { buildView } from "./lib/derive.js";
import { mondayOnOrBefore, todayISO, weekIndex } from "./lib/dates.js";
import { plansAfterFeedback, rirForWeek } from "./lib/progression.js";
import { newExercise, newId } from "./lib/types.js";
import { loginRequest, logoutRequest, pushAndPull } from "./sync/client.js";
import { SYNC_NOT_READY } from "./sync/messages.js";

function activeMeso(all) {
  return all.mesocycles.find((meso) => meso.status === "active" && !meso.deletedAt) || null;
}

export function GymDataProvider({ children }) {
  const repository = useState(() => createRepository(createIndexedDbStorage()))[0];
  const [snapshot, setSnapshot] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [sync, setSync] = useState({
    phase: "checking",
    configured: false,
    authenticated: false,
    checked: false,
    message: SYNC_NOT_READY,
  });
  const today = useState(() => todayISO())[0];
  const chain = useRef(Promise.resolve());

  const refresh = useCallback(async () => {
    const all = await repository.loadAll();
    setSnapshot(all);
    return all;
  }, [repository]);

  const enqueue = useCallback((fn) => {
    const run = chain.current.then(fn, fn);
    chain.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const runSync = useCallback(
    () =>
      enqueue(async () => {
        let result = await pushAndPull(repository);
        const repaired = await repository.ensureSeed(new Date());
        if (repaired && result?.authenticated) result = await pushAndPull(repository);
        setSync({ ...result, checked: true });
        await refresh();
        return result;
      }),
    [enqueue, refresh, repository],
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        await repository.ensureSeed(new Date());
        const all = await repository.loadAll();
        if (cancel) return;
        setSnapshot(all);
        setReady(true);
      } catch (err) {
        if (!cancel) setError(err?.message || "Couldn't open the log on this device.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [repository]);

  useEffect(() => {
    if (!ready) return undefined;
    runSync();
    const onOnline = () => runSync();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [ready, runSync]);

  const view = useMemo(() => (snapshot ? buildView(snapshot, { today, showSample: false }) : null), [snapshot, today]);

  const actions = useMemo(() => {
    async function mutate(fn) {
      await enqueue(async () => {
        await fn();
        await refresh();
      });
      runSync();
    }

    return {
      async saveSet({ day, plan, setNumber, patch }) {
        await mutate(async () => {
          const all = await repository.loadAll();
          const meso = activeMeso(all);
          if (!meso || !day || !plan) return;
          const workoutId = `${meso.id}:${day.id}:${today}`;
          const existingWorkout = all.workouts.find((row) => row.id === workoutId);
          const now = new Date().toISOString();
          await repository.saveRecord("workouts", {
            id: workoutId,
            mesoId: meso.id,
            trainingDayId: day.id,
            weekIndex: weekIndex(meso.startedOn, today),
            date: today,
            startedAt: existingWorkout?.startedAt || now,
            finishedAt: existingWorkout?.finishedAt || null,
            status: existingWorkout?.status === "completed" ? "completed" : "in_progress",
            notes: existingWorkout?.notes || "",
            sample: false,
            deletedAt: null,
            serverReceivedAt: null,
          });
          const setId = `${workoutId}:${plan.id}:${setNumber}`;
          const existingSet = all.sets.find((row) => row.id === setId);
          await repository.saveRecord("sets", {
            loadKg: null,
            loadLabel: plan.loadLabel || "bodyweight",
            reps: null,
            seconds: null,
            steps: null,
            rir: plan.targetRir,
            variation: plan.variation,
            completed: false,
            serverReceivedAt: null,
            ...existingSet,
            ...patch,
            id: setId,
            workoutId,
            plannedExerciseId: plan.id,
            exerciseId: plan.exerciseId,
            setNumber,
            sample: false,
            deletedAt: null,
          });
        });
      },
      async finishWorkout(day) {
        await mutate(async () => {
          const all = await repository.loadAll();
          const meso = activeMeso(all);
          if (!meso || !day) return;
          const workout = all.workouts.find((row) => row.id === `${meso.id}:${day.id}:${today}`);
          if (!workout) return;
          await repository.saveRecord("workouts", {
            ...workout,
            status: "completed",
            finishedAt: new Date().toISOString(),
          });
        });
      },
      async setWorkoutNotes(day, notes) {
        await mutate(async () => {
          const all = await repository.loadAll();
          const meso = activeMeso(all);
          if (!meso || !day) return;
          const workoutId = `${meso.id}:${day.id}:${today}`;
          const existing = all.workouts.find((row) => row.id === workoutId);
          const now = new Date().toISOString();
          await repository.saveRecord("workouts", {
            id: workoutId,
            mesoId: meso.id,
            trainingDayId: day.id,
            weekIndex: weekIndex(meso.startedOn, today),
            date: today,
            startedAt: existing?.startedAt || now,
            finishedAt: existing?.finishedAt || null,
            status: existing?.status || "in_progress",
            notes,
            sample: false,
            deletedAt: null,
            serverReceivedAt: null,
          });
        });
      },
      async saveMuscleFeedback({ workoutId, muscle, patch, day, apply }) {
        await mutate(async () => {
          const all = await repository.loadAll();
          const id = `${workoutId}:${muscle}`;
          const existing = all.feedback.find((row) => row.id === id);
          const saved = await repository.saveRecord("feedback", {
            jointPain: "",
            soreness: "",
            pump: "",
            workload: "",
            exerciseId: null,
            appliedDelta: null,
            sample: false,
            deletedAt: null,
            serverReceivedAt: null,
            ...existing,
            ...patch,
            id,
            workoutId,
            muscle,
          });
          if (!apply || !day) return;
          const meso = activeMeso(all);
          const exercises = Object.fromEntries(all.exercises.map((row) => [row.id, row]));
          const plans = all.plannedExercises.filter((row) => row.trainingDayId === day.id && !row.deletedAt && exercises[row.exerciseId]?.muscle === muscle);
          const template = all.mesocycles.find((row) => row.kind === "template" && !row.deletedAt);
          const templateDay = all.trainingDays.find((row) => row.mesoId === template?.id && row.label === day.label && !row.deletedAt);
          const templatePlans = all.plannedExercises.filter((row) => row.trainingDayId === templateDay?.id && !row.deletedAt);
          const templateSets = {};
          for (const plan of templatePlans) {
            templateSets[plan.exerciseId] = plan.setsMin;
            templateSets[`${plan.exerciseId}:max`] = plan.setsMax;
          }
          const performances = {};
          for (const plan of plans) {
            const latest = all.sets
              .filter((set) => set.exerciseId === plan.exerciseId && set.completed && !set.deletedAt && !set.sample)
              .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
            if (latest) performances[plan.exerciseId] = latest;
          }
          const week = rirForWeek(weekIndex(meso?.startedOn, today), meso?.weeks || 5, meso?.includesDeload !== false);
          const result = plansAfterFeedback(plans, exercises, {
            jointPain: saved.jointPain,
            soreness: saved.soreness,
            pump: saved.pump,
            workload: saved.workload,
            deload: week.deload,
            performances,
            templateSets,
            appliedDelta: Number.isFinite(existing?.appliedDelta) ? existing.appliedDelta : 0,
          });
          for (const plan of result.plans) {
            const stored = { ...plan };
            delete stored.recommendation;
            await repository.saveRecord("plannedExercises", stored);
          }
          if (result.appliedDelta !== saved.appliedDelta) {
            await repository.saveRecord("feedback", { ...saved, appliedDelta: result.appliedDelta });
          }
        });
      },
      async updatePlanned(plan, patch) {
        await mutate(async () => {
          await repository.saveRecord("plannedExercises", { ...plan, ...patch, deletedAt: plan.deletedAt || null });
        });
      },
      async addToSession({ day, exerciseId, alsoTemplate }) {
        await mutate(async () => {
          const all = await repository.loadAll();
          const template = all.mesocycles.find((meso) => meso.kind === "template" && !meso.deletedAt);
          const templateDay = alsoTemplate
            ? all.trainingDays.find((item) => item.mesoId === template?.id && item.label === day.label && !item.deletedAt)
            : null;
          await repository.appendExercise(day.id, exerciseId, {
            alsoDayId: templateDay && templateDay.id !== day.id ? templateDay.id : null,
            targetRir: day.targetRir,
          });
        });
      },
      async addPlanned(day, exerciseId) {
        await mutate(async () => {
          const all = await repository.loadAll();
          const exercise = all.exercises.find((row) => row.id === exerciseId);
          const siblings = all.plannedExercises.filter((row) => row.trainingDayId === day.id && !row.deletedAt);
          await repository.saveRecord("plannedExercises", {
            id: newId("plan"),
            trainingDayId: day.id,
            exerciseId,
            sortOrder: siblings.length,
            setsMin: 2,
            setsMax: 3,
            repsMin: 8,
            repsMax: 12,
            targetDose: 8,
            targetRir: day.targetRir,
            perSide: Boolean(exercise?.perSide),
            optional: false,
            laterOption: false,
            notes: "",
            variation: exercise?.defaultVariation || "standard",
            loadKg: null,
            loadLabel: exercise?.equipment === "band" ? "light" : "bodyweight",
            deletedAt: null,
            serverReceivedAt: null,
          });
        });
      },
      async removePlanned(plan) {
        await mutate(async () => {
          await repository.softDelete("plannedExercises", plan.id);
        });
      },
      async movePlan(plan, direction) {
        await mutate(async () => {
          const all = await repository.loadAll();
          const siblings = all.plannedExercises
            .filter((row) => row.trainingDayId === plan.trainingDayId && !row.deletedAt)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          const index = siblings.findIndex((row) => row.id === plan.id);
          const swap = siblings[index + direction];
          if (!swap) return;
          await repository.saveRecord("plannedExercises", { ...plan, sortOrder: swap.sortOrder });
          await repository.saveRecord("plannedExercises", { ...swap, sortOrder: plan.sortOrder });
        });
      },
      async addWorkoutDay({ name, weekday, timeLabel, targetRir }) {
        await mutate(async () => {
          const all = await repository.loadAll();
          const template = all.mesocycles.find((meso) => meso.kind === "template" && !meso.deletedAt);
          const meso = activeMeso(all);
          const targets = [template, meso].filter(Boolean);
          for (const owner of targets) {
            const count = all.trainingDays.filter((day) => day.mesoId === owner.id && !day.deletedAt).length;
            await repository.saveRecord("trainingDays", {
              id: newId("day"),
              mesoId: owner.id,
              label: name.trim().slice(0, 12) || "Day",
              name: name.trim() || "Custom",
              weekday: Number(weekday),
              timeLabel: timeLabel || "18:30",
              focus: "Custom",
              targetRir: targetRir ?? 3,
              restMinSeconds: 60,
              restMaxSeconds: 120,
              sortOrder: count,
              isLight: Number(weekday) === 0,
              warmup: "",
              deletedAt: null,
              serverReceivedAt: null,
            });
          }
        });
      },
      async addExercise(partial) {
        let created = null;
        await mutate(async () => {
          created = newExercise(partial);
          await repository.saveRecord("exercises", created);
        });
        return created;
      },
      async updateExercise(exercise, patch) {
        await mutate(async () => {
          await repository.saveRecord("exercises", { ...exercise, ...patch });
        });
      },
      async deleteExercise(exercise) {
        if (!exercise.custom) return;
        await mutate(async () => {
          await repository.softDelete("exercises", exercise.id);
        });
      },
      async copyTemplateOntoMeso() {
        await mutate(async () => {
          const all = await repository.loadAll();
          const template = all.mesocycles.find((meso) => meso.kind === "template" && !meso.deletedAt);
          const meso = activeMeso(all);
          if (!template || !meso) return;
          await repository.copyTemplateOntoMeso(template.id, meso.id);
        });
      },
      async startMeso(draft) {
        await mutate(async () => {
          const all = await repository.loadAll();
          const template = all.mesocycles.find((meso) => meso.kind === "template" && !meso.deletedAt);
          const current = activeMeso(all);
          if (current) await repository.saveRecord("mesocycles", { ...current, status: "completed" });
          const id = newId("meso");
          const weeks = Math.max(2, Number(draft?.weeks) || template?.weeks || 5);
          await repository.saveRecord("mesocycles", {
            ...(template || {}),
            id,
            name: draft?.name || "New mesocycle",
            kind: "meso",
            templateId: template?.id || null,
            status: "active",
            weeks,
            includesDeload: draft ? draft.includesDeload !== false : template?.includesDeload !== false,
            focus: template?.focus || "Return phase",
            notes: template?.notes || "",
            startedOn: mondayOnOrBefore(new Date()),
            deletedAt: null,
          });
          const sourceDays = draft?.days || all.trainingDays
            .filter((day) => day.mesoId === template?.id && !day.deletedAt)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((day) => ({
              ...day,
              exerciseIds: all.plannedExercises.filter((plan) => plan.trainingDayId === day.id && !plan.deletedAt).map((plan) => plan.exerciseId),
            }));
          for (const [index, day] of sourceDays.entries()) {
            const dayId = newId("day");
            await repository.saveRecord("trainingDays", {
              id: dayId,
              mesoId: id,
              label: day.label,
              name: day.name,
              weekday: day.weekday,
              timeLabel: day.timeLabel || "18:30",
              focus: day.focus || "",
              targetRir: 3,
              restMinSeconds: 60,
              restMaxSeconds: 120,
              sortOrder: index,
              isLight: Boolean(day.isLight),
              warmup: day.warmup || "",
              deletedAt: null,
              serverReceivedAt: null,
            });
            const ids = day.exerciseIds || [];
            for (const [sortOrder, exerciseId] of ids.entries()) {
              const templatePlan = all.plannedExercises.find((plan) => plan.trainingDayId === day.id && plan.exerciseId === exerciseId && !plan.deletedAt)
                || all.plannedExercises.find((plan) => plan.exerciseId === exerciseId && !plan.deletedAt);
              const exercise = all.exercises.find((row) => row.id === exerciseId);
              await repository.saveRecord("plannedExercises", {
                id: newId("plan"),
                trainingDayId: dayId,
                exerciseId,
                sortOrder,
                setsMin: templatePlan?.setsMin || 2,
                setsMax: templatePlan?.setsMax || 3,
                repsMin: templatePlan?.repsMin || 8,
                repsMax: templatePlan?.repsMax || 12,
                targetDose: templatePlan?.targetDose || templatePlan?.repsMin || 8,
                targetRir: templatePlan?.targetRir ?? day.targetRir ?? 3,
                perSide: templatePlan?.perSide ?? Boolean(exercise?.perSide),
                optional: Boolean(templatePlan?.optional),
                laterOption: false,
                notes: templatePlan?.notes || "",
                variation: templatePlan?.variation || exercise?.defaultVariation || "standard",
                loadKg: templatePlan?.loadKg ?? null,
                loadLabel: templatePlan?.loadLabel || (exercise?.equipment === "band" ? "light" : "bodyweight"),
                deletedAt: null,
                serverReceivedAt: null,
              });
            }
          }
        });
      },
      async exportJson() {
        const bundle = await repository.exportBundle();
        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `meso-backup-${today}.json`;
        link.click();
        URL.revokeObjectURL(url);
      },
      async importJson(fileText) {
        const parsed = JSON.parse(fileText);
        await mutate(async () => {
          await repository.importBundle(parsed);
        });
      },
      async login(passcode) {
        let result;
        try {
          result = await loginRequest(passcode);
        } catch {
          result = { configured: false, authenticated: false, message: SYNC_NOT_READY };
        }
        if (!result.authenticated) {
          setSync({
            phase: result.configured ? "signed_out" : "local",
            configured: Boolean(result.configured),
            authenticated: false,
            checked: true,
            message: result.configured ? "That passcode didn't match." : SYNC_NOT_READY,
          });
          return { ...result, message: result.configured ? "That passcode didn't match." : result.message };
        }
        await runSync();
        return result;
      },
      async logout() {
        await logoutRequest();
        setSync({
          phase: "signed_out",
          configured: true,
          authenticated: false,
          checked: true,
          message: "Not signed in",
        });
      },
      async clearAll() {
        await mutate(async () => {
          await repository.clearAll();
          await repository.ensureSeed(new Date());
        });
      },
    };
  }, [enqueue, refresh, repository, runSync, today]);

  const value = { ready, error, today, sync, view, actions };
  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}
