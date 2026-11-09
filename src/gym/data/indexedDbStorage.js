const DEFAULT_NAME = "meso";
const VERSION = 1;

export const IDB_STORES = [
  "exercises",
  "mesocycles",
  "trainingDays",
  "plannedExercises",
  "workouts",
  "sets",
  "feedback",
  "safetyChecks",
  "meta",
  "outbox",
];

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

export function createIndexedDbStorage({ name = DEFAULT_NAME } = {}) {
  let opening = null;

  function open() {
    if (!opening) {
      opening = new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
          reject(new Error("IndexedDB is not available in this browser."));
          return;
        }
        const request = indexedDB.open(name, VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          for (const store of IDB_STORES) {
            if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: "id" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return opening;
  }

  async function run(table, mode, fn) {
    const db = await open();
    const tx = db.transaction(table, mode);
    const done = transactionDone(tx);
    const result = await requestToPromise(fn(tx.objectStore(table)));
    await done;
    return result;
  }

  return {
    async getAll(table) {
      return (await run(table, "readonly", (store) => store.getAll())) || [];
    },
    async get(table, id) {
      return (await run(table, "readonly", (store) => store.get(id))) || null;
    },
    async put(table, record) {
      if (!record?.id) throw new Error(`Missing id for ${table}`);
      await run(table, "readwrite", (store) => store.put(record));
    },
    async delete(table, id) {
      await run(table, "readwrite", (store) => store.delete(id));
    },
    async clear(table) {
      await run(table, "readwrite", (store) => store.clear());
    },
  };
}
