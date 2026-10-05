import { now } from "@/lib/today";
import { runDueDigests } from "@/server/digest";
import { ingestAll } from "@/server/ingest";

export const dynamic = "force-dynamic";

/** Manual trigger for the scheduler. Requires CRON_SECRET as a bearer token. */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const ingest = await ingestAll(now(), { force: true });
  const digests = await runDueDigests(now());
  return Response.json({ ingest, digests });
}
