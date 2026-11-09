import { SYNC_NOT_READY } from "../../src/gym/sync/messages.js";
import {
  clearSessionCookie,
  gymEnv,
  readCookie,
  requestIsSecure,
  sessionCookie,
  signSession,
  verifySession,
  passcodesMatch,
} from "./session.js";

export function sendJson(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}

export async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  if (raw.length > 1_500_000) {
    const error = new Error("payload");
    error.statusCode = 413;
    throw error;
  }
  return JSON.parse(raw);
}

export function notConfiguredBody() {
  return { configured: false, authenticated: false, message: SYNC_NOT_READY };
}

export function createHandler(fn, { auth = true } = {}) {
  return async function handler(req, res) {
    try {
      const env = gymEnv();
      if (!env.configured) {
        sendJson(res, req.method === "POST" && auth ? 503 : 200, notConfiguredBody());
        return;
      }
      let session = { ok: false };
      if (auth) {
        session = verifySession(readCookie(req), env.sessionSecret);
        if (!session.ok) {
          sendJson(res, 401, { configured: true, authenticated: false, message: "Sign in to sync." });
          return;
        }
      }
      await fn(req, res, env, session);
    } catch (error) {
      const status = error?.statusCode || 500;
      if (status >= 500) console.error("gym api error");
      sendJson(res, status, { message: status === 413 ? "That sync payload is too large." : "Something went wrong on the sync server." });
    }
  };
}

export async function handleStatus(req, res) {
  const env = gymEnv();
  if (!env.configured) {
    sendJson(res, 200, notConfiguredBody());
    return;
  }
  const session = verifySession(readCookie(req), env.sessionSecret);
  sendJson(res, 200, { configured: true, authenticated: session.ok, message: session.ok ? "Signed in." : "Sign in to sync." });
}

export async function handleLogin(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { message: "Use POST." });
    return;
  }
  const env = gymEnv();
  if (!env.configured) {
    sendJson(res, 503, notConfiguredBody());
    return;
  }
  const body = await readBody(req);
  if (!passcodesMatch(body.passcode, env.accessKey)) {
    sendJson(res, 401, { configured: true, authenticated: false, message: "That passcode didn't match." });
    return;
  }
  const secure = requestIsSecure(req);
  sendJson(res, 200, { configured: true, authenticated: true, message: "Signed in." }, {
    "Set-Cookie": sessionCookie(signSession(env.sessionSecret), { secure }),
  });
}

export async function handleLogout(req, res) {
  sendJson(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie(requestIsSecure(req)) });
}
