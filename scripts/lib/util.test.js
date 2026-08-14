import { describe, expect, it } from "vitest";
import { requireNumber, requireString, round, toLocalDate, toNumberOrNull } from "./util.js";

describe("round", () => {
  it("rounds to the given decimal places", () => {
    expect(round(5.14159, 2)).toBe(5.14);
    expect(round(5.145, 2)).toBe(5.15);
  });

  it("defaults to 2 decimal places", () => {
    expect(round(1.005001)).toBe(1.01);
  });
});

describe("toLocalDate", () => {
  it("converts a UTC timestamp to the configured local calendar date", () => {
    // 23:30 UTC on Jan 1 is already Jan 2 in Europe/Berlin (UTC+1 in Jan).
    expect(toLocalDate("2026-01-01T23:30:00Z", "Europe/Berlin")).toBe("2026-01-02");
  });

  it("does not roll the date over in a timezone behind UTC", () => {
    expect(toLocalDate("2026-01-01T23:30:00Z", "America/New_York")).toBe("2026-01-01");
  });

  it("handles the midnight boundary correctly (the original off-by-one bug)", () => {
    expect(toLocalDate("2026-06-01T00:30:00Z", "Europe/Berlin")).toBe("2026-06-01");
  });
});

describe("toNumberOrNull", () => {
  it("returns null for null, undefined, and empty string", () => {
    expect(toNumberOrNull(null)).toBeNull();
    expect(toNumberOrNull(undefined)).toBeNull();
    expect(toNumberOrNull("")).toBeNull();
  });

  it("returns null for non-numeric strings instead of NaN", () => {
    expect(toNumberOrNull("not-a-number")).toBeNull();
  });

  it("coerces numeric strings and numbers", () => {
    expect(toNumberOrNull("42")).toBe(42);
    expect(toNumberOrNull(42)).toBe(42);
    expect(toNumberOrNull(0)).toBe(0);
  });
});

describe("requireNumber", () => {
  it("returns the coerced number for valid input", () => {
    expect(requireNumber("42", "field")).toBe(42);
    expect(requireNumber(42, "field")).toBe(42);
    expect(requireNumber(0, "field")).toBe(0);
  });

  it("throws for null, undefined, empty string, and non-numeric values", () => {
    expect(() => requireNumber(null, "field")).toThrow(/field/);
    expect(() => requireNumber(undefined, "field")).toThrow(/field/);
    expect(() => requireNumber("", "field")).toThrow(/field/);
    expect(() => requireNumber("not-a-number", "field")).toThrow(/field/);
  });

  it("names the offending field in the error message", () => {
    expect(() => requireNumber(undefined, "activity_id")).toThrow(/activity_id/);
  });
});

describe("requireString", () => {
  it("returns the string for valid non-empty input", () => {
    expect(requireString("hello", "field")).toBe("hello");
  });

  it("throws for null, undefined, non-strings, and blank strings", () => {
    expect(() => requireString(null, "field")).toThrow(/field/);
    expect(() => requireString(undefined, "field")).toThrow(/field/);
    expect(() => requireString(42, "field")).toThrow(/field/);
    expect(() => requireString("   ", "field")).toThrow(/field/);
  });
});
