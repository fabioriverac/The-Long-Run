import { useState } from "react";
import { JOINT_PAIN, PUMP, SORENESS, WORKLOAD } from "../lib/types.js";
import { ChoiceGroup, Sheet } from "./ui.jsx";

export function SorenessSheet({ muscle, onClose, onSave }) {
  const [value, setValue] = useState("just_in_time");
  return (
    <Sheet title="Soreness" kicker={muscle} onClose={onClose}>
      <ChoiceGroup
        label={`${muscle} soreness`}
        hint={`How sore did you get in your ${muscle.toLowerCase()} after training them last time?`}
        value={value}
        options={SORENESS}
        onChange={setValue}
        columns={2}
      />
      <div className="gym-sheet__actions">
        <button type="button" className="gym-secondary" onClick={onClose}>Later</button>
        <button type="button" className="gym-primary" onClick={() => onSave(value)}>Save</button>
      </div>
    </Sheet>
  );
}

export function MuscleFeedbackSheet({ muscle, onClose, onSave }) {
  const [draft, setDraft] = useState({
    jointPain: "none",
    pump: "moderate",
    workload: "pretty_good",
  });
  const set = (key) => (value) => setDraft((prev) => ({ ...prev, [key]: value }));
  return (
    <Sheet title="Feedback" kicker={muscle} onClose={onClose}>
      <ChoiceGroup
        label="Joint pain"
        hint={`How did your joints feel during ${muscle.toLowerCase()}?`}
        value={draft.jointPain}
        options={JOINT_PAIN}
        onChange={set("jointPain")}
      />
      <ChoiceGroup
        label="Pump"
        hint={`How much of a pump did you get in your ${muscle.toLowerCase()}?`}
        value={draft.pump}
        options={PUMP}
        onChange={set("pump")}
      />
      <ChoiceGroup
        label="Workload"
        hint={`How was the amount of work for your ${muscle.toLowerCase()}?`}
        value={draft.workload}
        options={WORKLOAD}
        onChange={set("workload")}
        columns={2}
      />
      <div className="gym-sheet__actions">
        <button type="button" className="gym-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="gym-primary" onClick={() => onSave(draft)}>Save</button>
      </div>
    </Sheet>
  );
}

export function SwapSheet({ muscle, exercises, currentId, onClose, onPick }) {
  const choices = exercises.filter((exercise) => exercise.muscle === muscle && exercise.id !== currentId && exercise.equipment !== "machine");
  return (
    <Sheet title="Swap exercise" kicker={muscle} onClose={onClose}>
      {choices.length === 0 ? <p className="gym-note">Nothing else in this muscle yet. Add one from the exercise list.</p> : null}
      {choices.map((exercise) => (
        <button key={exercise.id} type="button" className="gym-exercise" onClick={() => onPick(exercise)}>
          <span>
            <strong>{exercise.name}</strong><br />
            <small>{exercise.equipment}{exercise.regression ? ` · ${exercise.regression.label}` : ""}</small>
          </span>
        </button>
      ))}
    </Sheet>
  );
}
