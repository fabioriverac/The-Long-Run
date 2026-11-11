import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useGymData } from "../useGymData.js";

export default function SignInScreen() {
  const { actions } = useGymData();
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useDocumentTitle("Sign in");

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await actions.login(passcode);
    setBusy(false);
    if (!result?.authenticated) {
      if (result?.configured) setError("That passcode didn't match.");
      return;
    }
    navigate("/gym", { replace: true });
  }

  return (
    <div className="gym">
      <div className="gym-shell gym-signin">
        <p className="gym-kicker">The Long Run / Gym</p>
        <p className="gym-logo">meso.</p>
        <h1 className="gym-title">Sign in</h1>
        <form onSubmit={onSubmit}>
          <label className="gym-field">
            <span>Passcode</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              autoFocus
            />
          </label>
          {error ? <p className="gym-signin__error">{error}</p> : null}
          <button type="submit" className="gym-finish" disabled={busy || !passcode}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
