import { describe, expect, it } from "vitest";
import { clearSessionCookie, passcodesMatch, sessionCookie, signSession, verifySession } from "./session.js";

describe("gym session", () => {
  it("accepts a signed cookie and rejects tampering or expiry", () => {
    const token = signSession("test-secret", 1_700_000_000_000);
    expect(verifySession(token, "test-secret", 1_700_000_000_000).ok).toBe(true);
    expect(verifySession(token, "other-secret", 1_700_000_000_000).ok).toBe(false);
    const [body] = token.split(".");
    expect(verifySession(`${body}.aaaa`, "test-secret", 1_700_000_000_000).ok).toBe(false);
    expect(verifySession(token, "test-secret", 1_900_000_000_000).reason).toBe("expired");
  });

  it("compares the passcode without accepting a different length", () => {
    expect(passcodesMatch("correct horse battery", "correct horse battery")).toBe(true);
    expect(passcodesMatch("nope", "correct horse battery")).toBe(false);
    expect(passcodesMatch("", "correct horse battery")).toBe(false);
    expect(passcodesMatch("correct horse battery", "")).toBe(false);
  });

  it("sets an HttpOnly cookie and can clear it", () => {
    const header = sessionCookie("abc.def", { secure: true });
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");
    expect(clearSessionCookie(true)).toContain("Max-Age=0");
  });
});
