import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/newsinmail_test";
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query("select 1");
  } catch (err) {
    throw new Error(`Test database not reachable at ${url}. Run: service postgresql start (${(err as Error).message})`);
  }
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
}
