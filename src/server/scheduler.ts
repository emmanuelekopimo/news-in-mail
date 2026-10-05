import { now } from "@/lib/today";
import { runDueDigests } from "./digest";
import { ingestAll } from "./ingest";

const TICK_MS = 5 * 60_000;

/** Starts the in-process scheduler: refresh feeds and send due digests every 5 minutes. */
export function startScheduler() {
  const g = globalThis as unknown as { __nimScheduler?: boolean };
  if (g.__nimScheduler) return;
  g.__nimScheduler = true;

  const tick = async () => {
    try {
      await ingestAll(now());
      const r = await runDueDigests(now());
      if (r.sent) console.log(`[scheduler] sent ${r.sent} digests`);
    } catch (err) {
      console.error("[scheduler] tick failed", err);
    }
  };
  setTimeout(tick, 15_000);
  setInterval(tick, TICK_MS);
  console.log("[scheduler] started");
}
