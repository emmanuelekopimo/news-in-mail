import "dotenv/config";
import { db, pool } from "../src/db";
import { now } from "../src/lib/today";
import { appUrl } from "../src/server/digest";
import { seedDatabase } from "../src/server/seed";

async function main() {
  const onlyIfEmpty = process.argv.includes("--if-empty");
  if (onlyIfEmpty) {
    const { rows } = await pool.query<{ n: string }>("select count(*)::text as n from users");
    if (Number(rows[0].n) > 0) {
      console.log("[seed] database already has users, skipping");
      await pool.end();
      return;
    }
  }
  const result = await seedDatabase(db, now(), appUrl());
  console.log(`[seed] loaded ${result.users} users and ${result.articles} sample stories`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
