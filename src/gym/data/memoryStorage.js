export function createMemoryStorage() {
  const tables = new Map();

  function bucket(name) {
    if (!tables.has(name)) tables.set(name, new Map());
    return tables.get(name);
  }

  return {
    async getAll(table) {
      return [...bucket(table).values()].map((row) => structuredClone(row));
    },
    async get(table, id) {
      const row = bucket(table).get(id);
      return row ? structuredClone(row) : null;
    },
    async put(table, record) {
      if (!record?.id) throw new Error(`Missing id for ${table}`);
      bucket(table).set(record.id, structuredClone(record));
    },
    async delete(table, id) {
      bucket(table).delete(id);
    },
    async clear(table) {
      bucket(table).clear();
    },
  };
}
