import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GymContext } from "./gym-context.js";
import { createIndexedDbStorage } from "./data/indexedDbStorage.js";
import { createRepository } from "./data/repository.js";
import { buildView } from "./lib/derive.js";
import { mondayOnOrBefore, todayISO, weekIndex } from "./lib/dates.js";
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
    phase: "local",
    configured: false,
    authenticated: false,
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
        const result = await pushAndPull(repository);
        setSync(result);
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

  const showSample = Boolean(snapshot?.meta?.prefs?.showSample);
  const view = useMemo(() => (snapshot ? buildView(snapshot, { today, showSample }) : null), [snapshot, today, showSample]);

  const actions = useMemo(() => {
    async function mutate(fn) {
      await enqueue(async () => {
        await fn();
        await refresh();
      });
      runSync();
    }

    return {
      toggleSample() {
        return mutate(async () => {
          const all = await repository.loadAll();
          const next = !all.meta.prefs?.showSample;
          if (next) await repository.ensureSample(today);
          await repository.saveMeta({ id: "prefs", showSample: next });
        });
      },
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
      async saveFeedback({ day, exerciseId, draft }) {
        await mutate(async () => {
          const all = await repository.loadAll();
          const meso = activeMeso(all);
          if (!meso || !day) return;
          const workoutId = `${meso.id}:${day.id}:${today}`;
          const existing = all.workouts.find((row) => row.id === workoutId);
          const now = new Date().toISOString();
          if (!existing) {
            await repository.saveRecord("workouts", {
              id: workoutId,
              mesoId: meso.id,
              trainingDayId: day.id,
              weekIndex: weekIndex(meso.startedOn, today),
              date: today,
              startedAt: now,
              finishedAt: null,
              status: "in_progress",
              notes: "",
              sample: false,
              deletedAt: null,
              serverReceivedAt: null,
            });
          }
          await repository.saveRecord("feedback", {
            id: `${workoutId}:${exerciseId}`,
            workoutId,
            exerciseId,
            jointPain: draft.jointPain,
            soreness: draft.soreness,
            pump: draft.pump,
            workload: draft.workload,
            sample: false,
            deletedAt: null,
            serverReceivedAt: null,
          });
        });
      },
      async saveSafety({ workoutId, kind, draft }) {
        await mutate(async () => {
          await repository.saveRecord("safetyChecks", {
            id: `${workoutId}:${kind}`,
            workoutId,
            kind,
            painLocation: draft.painLocation === "None" ? "" : draft.painLocation || "",
            painDuring: kind === "session" ? Number(draft.painDuring) : null,
            painQuality: draft.painQuality || "none",
            firstStepVsBaseline: kind === "next_morning" ? draft.firstStepVsBaseline : null,
            swelling: draft.swelling || "none",
            gaitChange: draft.gaitChange || "none",
            lossOfControl: Boolean(draft.lossOfControl),
            focalBonePain: Boolean(draft.focalBonePain),
            notes: draft.notes || "",
            sample: false,
            deletedAt: null,
            serverReceivedAt: null,
          });
        });
      },
      async updatePlanned(plan, patch) {
        await mutate(async () => {
          await repository.saveRecord("plannedExercises", { ...plan, ...patch, deletedAt: plan.deletedAt || null });
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
      async startMeso() {
        await mutate(async () => {
          const all = await repository.loadAll();
          const template = all.mesocycles.find((meso) => meso.kind === "template" && !meso.deletedAt);
          const current = activeMeso(all);
          if (!template) return;
          if (current) await repository.saveRecord("mesocycles", { ...current, status: "completed" });
          const id = newId("meso");
          await repository.saveRecord("mesocycles", {
            ...template,
            id,
            name: "Stronger for the long run",
            kind: "meso",
            templateId: template.id,
            status: "active",
            startedOn: mondayOnOrBefore(new Date()),
            deletedAt: null,
          });
          const days = all.trainingDays.filter((day) => day.mesoId === template.id && !day.deletedAt);
          for (const day of days) {
            const dayId = newId("day");
            await repository.saveRecord("trainingDays", { ...day, id: dayId, mesoId: id, deletedAt: null });
            const plans = all.plannedExercises.filter((plan) => plan.trainingDayId === day.id && !plan.deletedAt);
            for (const plan of plans) {
              await repository.saveRecord("plannedExercises", {
                ...plan,
                id: newId("plan"),
                trainingDayId: dayId,
                deletedAt: null,
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
            message: result.message || SYNC_NOT_READY,
          });
          return result;
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
          message: "Signed out. The log stays on this device.",
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
