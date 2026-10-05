import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/db";

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] done");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
