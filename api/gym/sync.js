import { changesSince, getGymDb, upsertChange } from "../../server/gym/db.js";
import { createHandler, readBody, sendJson } from "../../server/gym/http.js";
import { incomingWins } from "../../src/gym/sync/merge.js";

const ENTITIES = new Set([
  "exercises",
  "mesocycles",
  "trainingDays",
  "plannedExercises",
  "workouts",
  "sets",
  "feedback",
  "safetyChecks",
]);

async function sync(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { message: "Use POST." });
    return;
  }
  const body = await readBody(req);
  const changes = Array.isArray(body.changes) ? body.changes.slice(0, 500) : [];
  const db = await getGymDb();
  if (!db) {
    sendJson(res, 503, { configured: false, message: "Cloud sync not set up yet" });
    return;
  }
  const acked = [];
  for (const change of changes) {
    if (!ENTITIES.has(change?.entity) || typeof change?.id !== "string" || typeof change?.data?.updatedAt !== "string") {
      continue;
    }
    if (!incomingWins(null, change.data.updatedAt)) continue;
    const result = await upsertChange(db, { ...change, data: { ...change.data, id: change.id } });
    if (result.ok) {
      acked.push({
        changeId: change.changeId,
        entity: change.entity,
        entityId: change.id,
        updatedAt: change.data.updatedAt,
      });
    }
  }
  const serverChanges = await changesSince(db, typeof body.pulledAt === "string" ? body.pulledAt : null);
  sendJson(res, 200, {
    ok: true,
    configured: true,
    authenticated: true,
    acked,
    serverChanges,
    serverTime: new Date().toISOString(),
  });
}

export default createHandler(sync, { auth: true });
