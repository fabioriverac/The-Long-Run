import { useState } from "react";
import {
  FIRST_STEP,
  GAIT,
  JOINT_PAIN,
  PAIN_LOCATIONS,
  PAIN_QUALITY,
  PUMP,
  SORENESS,
  SWELLING,
  WORKLOAD,
} from "../lib/types.js";
import { CLINICIAN_NOTE, PAIN_NOT_CLEARANCE_NOTE, PHYSIO_NOTE, isRedFlag } from "../lib/progression.js";
import { ChoiceGroup, Sheet } from "./ui.jsx";

const HEEL = /heel|inner ankle|inner-ankle|plantar|posterior tib|arch/i;

export function FeedbackSheet({ exercise, initial, onClose, onSave }) {
  const [draft, setDraft] = useState({
    jointPain: initial?.jointPain || "none",
    soreness: initial?.soreness || "just_in_time",
    pump: initial?.pump || "moderate",
    workload: initial?.workload || "pretty_good",
  });
  const set = (key) => (value) => setDraft((prev) => ({ ...prev, [key]: value }));
  return (
    <Sheet title="Training feedback" kicker={`${exercise.muscle} · ${exercise.name}`} onClose={onClose}>
      <ChoiceGroup label="Joint pain" hint={`How did your joints feel during ${exercise.name}?`} value={draft.jointPain} options={JOINT_PAIN} onChange={set("jointPain")} />
      <ChoiceGroup label="Soreness since last session" hint={`${exercise.muscle} recovery since the last time you trained.`} value={draft.soreness} options={SORENESS} onChange={set("soreness")} />
      <ChoiceGroup label="Pump" hint={`How much of a pump did you get in your ${exercise.muscle.toLowerCase()}?`} value={draft.pump} options={PUMP} onChange={set("pump")} columns={3} />
      <ChoiceGroup label="Workload" hint={`How did today's ${exercise.muscle.toLowerCase()} training feel?`} value={draft.workload} options={WORKLOAD} onChange={set("workload")} />
      <div className="gym-sheet__actions">
        <button type="button" className="gym-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="gym-primary" onClick={() => onSave(draft)}>Save feedback</button>
      </div>
    </Sheet>
  );
}

export function SafetySheet({ title, kind, initial, priorHeel, onClose, onSave, finishLabel }) {
  const [draft, setDraft] = useState({
    painLocation: initial?.painLocation || "None",
    painDuring: initial?.painDuring ?? 0,
    painQuality: initial?.painQuality || "none",
    firstStepVsBaseline: initial?.firstStepVsBaseline || "same",
    swelling: initial?.swelling || "none",
    gaitChange: initial?.gaitChange || "none",
    lossOfControl: Boolean(initial?.lossOfControl),
    focalBonePain: Boolean(initial?.focalBonePain),
    notes: initial?.notes || "",
  });
  const redFlag = isRedFlag({
    focalBonePain: draft.focalBonePain,
    swelling: draft.swelling,
    gaitChange: draft.gaitChange,
  });
  const heel = HEEL.test(draft.painLocation);
  return (
    <Sheet title={title} kicker={kind === "next_morning" ? "Next morning" : "Session safety"} onClose={onClose}>
      <ChoiceGroup
        label="Pain location"
        hint="Where, if anywhere? Left heel and inner ankle matter for this plan."
        value={draft.painLocation}
        options={PAIN_LOCATIONS.map((label) => ({ value: label, label: label === "Left inner ankle" ? "Inner ankle" : label }))}
        onChange={(value) => setDraft((prev) => ({ ...prev, painLocation: value }))}
        columns={2}
      />
      {kind === "session" ? (
        <label className="gym-range">
          <span>Pain during the session ({draft.painDuring}/10)</span>
          <input
            type="range"
            min="0"
            max="10"
            value={draft.painDuring}
            onChange={(event) => setDraft((prev) => ({ ...prev, painDuring: Number(event.target.value) }))}
          />
          <p className="gym-hint">{PAIN_NOT_CLEARANCE_NOTE}</p>
        </label>
      ) : null}
      <ChoiceGroup
        label={kind === "session" ? "What did the pain feel like?" : "First-step pain vs your baseline"}
        value={kind === "session" ? draft.painQuality : draft.firstStepVsBaseline}
        options={kind === "session" ? PAIN_QUALITY : FIRST_STEP}
        onChange={(value) =>
          setDraft((prev) => (kind === "session" ? { ...prev, painQuality: value } : { ...prev, firstStepVsBaseline: value }))
        }
      />
      <ChoiceGroup label="Swelling" value={draft.swelling} options={SWELLING} onChange={(value) => setDraft((prev) => ({ ...prev, swelling: value }))} columns={3} />
      <ChoiceGroup label="Gait" hint="Any change in how you walk, including the next morning." value={draft.gaitChange} options={GAIT} onChange={(value) => setDraft((prev) => ({ ...prev, gaitChange: value }))} columns={2} />
      <label className="gym-checkline">
        <input type="checkbox" checked={draft.lossOfControl} onChange={(event) => setDraft((prev) => ({ ...prev, lossOfControl: event.target.checked }))} />
        <span>Lost control of the movement (knee dive, hip drop, couldn't stay steady)</span>
      </label>
      <label className="gym-checkline">
        <input type="checkbox" checked={draft.focalBonePain} onChange={(event) => setDraft((prev) => ({ ...prev, focalBonePain: event.target.checked }))} />
        <span>Focal bone pain — a specific spot on the bone, not a general ache</span>
      </label>
      {redFlag ? <p className="gym-callout">{CLINICIAN_NOTE}</p> : null}
      {heel && priorHeel ? <p className="gym-callout">{PHYSIO_NOTE}</p> : null}
      {heel && !priorHeel ? (
        <p className="gym-callout">Heel and inner-ankle pain is the thing this plan is careful about. If it's still there next time, check in with a physio.</p>
      ) : null}
      <label className="gym-field">
        <span>Notes</span>
        <textarea rows={2} value={draft.notes} onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))} />
      </label>
      <div className="gym-sheet__actions">
        <button type="button" className="gym-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="gym-primary" onClick={() => onSave(draft)}>{finishLabel || "Save check"}</button>
      </div>
    </Sheet>
  );
}
