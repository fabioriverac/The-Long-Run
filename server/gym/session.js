import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "gym_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function gymEnv(env = process.env) {
  const databaseUrl = env.DATABASE_URL || env.POSTGRES_URL || "";
  const accessKey = env.GYM_ACCESS_KEY || "";
  const sessionSecret = env.GYM_SESSION_SECRET || "";
  return {
    databaseUrl,
    accessKey,
    sessionSecret,
    configured: Boolean(databaseUrl && accessKey && sessionSecret),
  };
}

export function passcodesMatch(input, expected) {
  const left = Buffer.from(String(input ?? ""));
  const right = Buffer.from(String(expected ?? ""));
  if (!right.length || left.length !== right.length) {
    const filler = Buffer.alloc(Math.max(right.length, 1));
    timingSafeEqual(filler, filler);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function signSession(secret, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ v: 1, sub: "gym", exp: now + MAX_AGE_SECONDS * 1000 })).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token, secret, now = Date.now()) {
  if (!token || !secret || !token.includes(".")) return { ok: false, reason: "missing" };
  const [body, sig] = token.split(".");
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return { ok: false, reason: "bad_signature" };
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.sub !== "gym" || typeof payload.exp !== "number" || payload.exp < now) {
      return { ok: false, reason: "expired" };
    }
    return { ok: true, payload };
  } catch {
    return { ok: false, reason: "bad_payload" };
  }
}

export function readCookie(req, name = COOKIE_NAME) {
  const header = req.headers?.cookie || "";
  for (const part of header.split(/; */)) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index) === name) return decodeURIComponent(part.slice(index + 1));
  }
  return "";
}

export function requestIsSecure(req) {
  const proto = req.headers?.["x-forwarded-proto"];
  if (proto) return String(proto).split(",")[0].trim() === "https";
  return process.env.VERCEL === "1";
}

export function sessionCookie(token, { secure, maxAge = MAX_AGE_SECONDS } = {}) {
  const parts = [`${COOKIE_NAME}=${encodeURIComponent(token)}`, "HttpOnly", "Path=/", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(secure) {
  return sessionCookie("", { secure, maxAge: 0 });
}
