import "dotenv/config";
import { pool } from "../src/db";
import { now } from "../src/lib/today";
import { ingestAll } from "../src/server/ingest";

ingestAll(now(), { force: true })
  .then((r) => console.log(r))
  .finally(() => pool.end());
