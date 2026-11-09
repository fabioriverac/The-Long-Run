import { describe, expect, it } from "vitest";
import { changesFromOutbox, chooseRecord, incomingWins, outboxAfterAck } from "./merge.js";

describe("sync merge", () => {
  it("keeps the newer record and treats an equal replay as already stored", () => {
    const local = { id: "a", updatedAt: "2026-11-09T12:00:00.000Z", name: "local" };
    const older = { id: "a", updatedAt: "2026-11-08T12:00:00.000Z", name: "old" };
    const newer = { id: "a", updatedAt: "2026-11-10T12:00:00.000Z", name: "new" };
    expect(chooseRecord(local, older)).toBe(local);
    expect(chooseRecord(local, newer)).toEqual(newer);
    expect(chooseRecord(local, { ...local })).toBe(local);
    expect(chooseRecord(null, newer)).toEqual(newer);
  });

  it("accepts an identical write so retries are idempotent, and rejects an older one", () => {
    expect(incomingWins("2026-11-09T00:00:00.000Z", "2026-11-09T00:00:00.000Z")).toBe(true);
    expect(incomingWins("2026-11-10T00:00:00.000Z", "2026-11-09T00:00:00.000Z")).toBe(false);
    expect(incomingWins(null, "2026-11-09T00:00:00.000Z")).toBe(true);
  });

  it("sends one change per entity, skips sample rows, and drops acked or superseded outbox items", () => {
    const snapshot = {
      exercises: [
        { id: "ex-1", updatedAt: "T3", sample: false, name: "Row" },
        { id: "ex-sample", updatedAt: "T3", sample: true, name: "Sample" },
      ],
    };
    const outbox = [
      { id: "exercises:ex-1:T1", entity: "exercises", entityId: "ex-1", updatedAt: "T1" },
      { id: "exercises:ex-1:T3", entity: "exercises", entityId: "ex-1", updatedAt: "T3" },
      { id: "exercises:ex-sample:T3", entity: "exercises", entityId: "ex-sample", updatedAt: "T3" },
    ];
    const changes = changesFromOutbox(outbox, snapshot);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ changeId: "exercises:ex-1:T3", id: "ex-1", updatedAt: "T3" });

    const remaining = outboxAfterAck(outbox, [
      { changeId: "exercises:ex-1:T3", entity: "exercises", entityId: "ex-1", updatedAt: "T3" },
    ]);
    expect(remaining.map((item) => item.id)).toEqual(["exercises:ex-sample:T3"]);
  });
});
