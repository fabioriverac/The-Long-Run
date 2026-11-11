import { DATA_TABLES } from "../lib/types.js";

/** Last-write-wins on updatedAt. Equal timestamps keep the copy already stored. */
export function chooseRecord(local, remote) {
  if (!remote) return local || null;
  if (!local) return remote;
  if (remote.updatedAt > local.updatedAt) return remote;
  return local;
}

/** True when an incoming write may replace the stored row, including an identical replay. */
export function incomingWins(existingUpdatedAt, incomingUpdatedAt) {
  if (!existingUpdatedAt) return true;
  if (!incomingUpdatedAt) return false;
  return incomingUpdatedAt >= existingUpdatedAt;
}

export function changesFromOutbox(outbox, snapshot) {
  const latest = new Map();
  for (const item of outbox || []) {
    const key = `${item.entity}:${item.entityId}`;
    const prev = latest.get(key);
    if (!prev || item.updatedAt > prev.updatedAt) latest.set(key, item);
  }
  const changes = [];
  for (const item of latest.values()) {
    if (!DATA_TABLES.includes(item.entity)) continue;
    const record = (snapshot[item.entity] || []).find((row) => row.id === item.entityId);
    if (!record || record.sample) continue;
    changes.push({
      changeId: item.id,
      entity: item.entity,
      id: item.entityId,
      updatedAt: record.updatedAt,
      deleted: Boolean(record.deletedAt),
      data: record,
    });
  }
  changes.sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)));
  return changes;
}

export function outboxAfterAck(outbox, acks) {
  const ackedIds = new Set((acks || []).map((ack) => ack.changeId));
  return (outbox || []).filter((item) => {
    if (ackedIds.has(item.id)) return false;
    const ack = (acks || []).find((entry) => entry.entity === item.entity && entry.entityId === item.entityId);
    if (ack && item.updatedAt <= ack.updatedAt) return false;
    return true;
  });
}
