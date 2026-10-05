import "dotenv/config";
import { Client } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/db";

/** Creates the target database if it does not exist (needed on a shared Postgres server). */
async function ensureDatabase(url: string) {
  const target = new URL(url);
  const name = decodeURIComponent(target.pathname.slice(1));
  if (!name || !/^[a-z0-9_]+$/i.test(name)) return;
  const admin = new URL(url);
  admin.pathname = "/postgres";
  const client = new Client({ connectionString: admin.toString() });
  try {
    await client.connect();
    const { rowCount } = await client.query("select 1 from pg_database where datname = $1", [name]);
    if (!rowCount) {
      await client.query(`create database "${name}"`);
      console.log(`[migrate] created database ${name}`);
    }
  } catch (err) {
    console.warn(`[migrate] could not check database ${name}: ${(err as Error).message}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function main() {
  if (process.env.DATABASE_URL) await ensureDatabase(process.env.DATABASE_URL);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] done");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
