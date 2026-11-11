import { runMigrations } from "../server/gym/migrate.js";

const result = await runMigrations();
console.log(result.message);
if (!result.ok) process.exit(1);
