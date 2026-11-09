import { changesFromOutbox } from "./merge.js";
import { SYNC_NOT_READY } from "./messages.js";

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function fetchSyncStatus() {
  try {
    const response = await fetch("/api/gym/status", { credentials: "same-origin" });
    const body = await readJson(response);
    if (!body || body.configured === false) {
      return { configured: false, authenticated: false, message: SYNC_NOT_READY };
    }
    return {
      configured: true,
      authenticated: Boolean(body.authenticated),
      message: body.message || (body.authenticated ? "Signed in." : "Sign in to sync."),
    };
  } catch {
    return { configured: false, authenticated: false, message: SYNC_NOT_READY };
  }
}

export async function loginRequest(passcode) {
  const response = await fetch("/api/gym/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode }),
  });
  const body = await readJson(response);
  if (!body) return { configured: false, authenticated: false, message: SYNC_NOT_READY };
  return { ...body, ok: response.ok };
}

export async function logoutRequest() {
  await fetch("/api/gym/logout", { method: "POST", credentials: "same-origin" });
}

export async function pushAndPull(repository) {
  const status = await fetchSyncStatus();
  if (!status.configured) return { ...status, phase: "local" };
  if (!status.authenticated) return { ...status, phase: "signed_out" };
  try {
    const all = await repository.loadAll();
    const changes = changesFromOutbox(all.outbox, all);
    const response = await fetch("/api/gym/sync", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes, pulledAt: all.meta.sync?.pulledAt || null }),
    });
    const body = await readJson(response);
    if (!response.ok || !body?.ok) {
      return {
        configured: true,
        authenticated: response.status !== 401,
        phase: "error",
        message: body?.message || "Couldn't reach cloud sync. Your log is still saved on this device.",
      };
    }
    await repository.applyRemoteChanges(body.serverChanges);
    await repository.ackOutbox(body.acked);
    await repository.saveMeta({ id: "sync", pulledAt: body.serverTime });
    return { configured: true, authenticated: true, phase: "synced", message: "Synced." };
  } catch {
    return {
      configured: true,
      authenticated: true,
      phase: "error",
      message: "Couldn't reach cloud sync. Your log is still saved on this device.",
    };
  }
}
