import { useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useGymData } from "../useGymData.js";
export default function MoreScreen() {
  const { sync, actions } = useGymData();
  const [message, setMessage] = useState("");
  const [confirmReset, setConfirmReset] = useState("");
  useDocumentTitle("More");
  const syncLine = sync.authenticated ? "Synced" : "Not signed in";
  return (
    <section>
      <h1 className="gym-title">More</h1>
      <article className="gym-card">
        <p className="gym-eyebrow">Cloud sync</p>
        <h2 style={{ marginTop: 8 }}>{syncLine}</h2>
        {sync.authenticated ? (
          <button type="button" className="gym-secondary" style={{ width: "100%", marginTop: 12 }} onClick={() => actions.logout()}>Sign out</button>
        ) : null}
        {message ? <p className="gym-note">{message}</p> : null}
      </article>
      <article className="gym-card">
        <h2>Backup</h2>
        <p className="gym-help">Export or restore the whole log as JSON, including the template.</p>
        <div className="gym-actions-col">
          <button type="button" className="gym-secondary" onClick={() => actions.exportJson()}>Export JSON</button>
          <label className="gym-secondary" style={{ display: "grid", placeItems: "center" }}>
            Import JSON
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  await actions.importJson(await file.text());
                  setMessage("Backup imported.");
                } catch (err) {
                  setMessage(err?.message || "That file couldn't be imported.");
                }
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </article>
      <article className="gym-card">
        <h2>Reset this device</h2>
        <p className="gym-help">Type reset to wipe the browser log and restore Coach's template. A cloud copy, if you were signed in, can sync back down.</p>
        <label className="gym-field">
          <span>Confirmation</span>
          <input value={confirmReset} onChange={(event) => setConfirmReset(event.target.value)} placeholder="reset" />
        </label>
        <button
          type="button"
          className="gym-finish"
          disabled={confirmReset !== "reset"}
          onClick={async () => {
            await actions.clearAll();
            setConfirmReset("");
            setMessage("Local log reset.");
          }}
        >
          Reset local log
        </button>
      </article>
      <p style={{ marginTop: 18 }}>
        <Link to="/" className="gym-home">Back to The Long Run</Link>
      </p>
    </section>
  );
}
