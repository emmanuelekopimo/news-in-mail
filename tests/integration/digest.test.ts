import { and, eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, pool } from "@/db";
import { articles, digests, interests, users } from "@/db/schema";
import { zonedToUtc } from "@/lib/schedule";
import { runDueDigests, sendDigest, userTopics } from "@/server/digest";
import { getDigest, listDigests } from "@/server/queries";
import { seedDatabase } from "@/server/seed";
import { DEMO_EMAIL } from "@/server/seed-data";

// 15:00 in Lagos: today's morning slot has passed, evening has not.
const AT = new Date("2026-10-05T14:00:00Z");

async function userByEmail(email: string) {
  const [u] = await db.select().from(users).where(eq(users.email, email));
  return u;
}

beforeEach(async () => {
  await seedDatabase(db, AT);
});

afterAll(async () => {
  await pool.end();
});

describe("seed", () => {
  it("loads users, sample stories and a digest history with problem cases", async () => {
    expect(await db.$count(users)).toBe(3);
    expect(await db.$count(articles)).toBeGreaterThan(20);
    const demo = await userByEmail(DEMO_EMAIL);
    const history = await listDigests(demo.id);
    const statuses = new Set(history.map((d) => d.status));
    expect(statuses).toEqual(new Set(["sent", "failed", "skipped"]));
    expect(history.some((d) => d.slot === "test")).toBe(true);
    // Nothing dated in the future.
    expect(history.every((d) => d.createdAt <= AT)).toBe(true);
  });
});

describe("sendDigest", () => {
  it("sends a test email with only the reader's topics", async () => {
    const demo = await userByEmail(DEMO_EMAIL);
    const topics = await userTopics(demo.id);
    const d = await sendDigest(demo, "test", AT);
    expect(d?.status).toBe("sent");
    expect(d?.deliveredVia).toBe("inbox");
    expect(d?.articleIds.length).toBeGreaterThan(0);
    const picked = await db.select().from(articles);
    for (const id of d!.articleIds) expect(topics).toContain(picked.find((a) => a.id === id)!.topic);
    expect(d?.html).toContain("Hello, Chiamaka");
  });

  it("records a skipped digest when there is nothing new", async () => {
    const demo = await userByEmail(DEMO_EMAIL);
    await db.delete(articles);
    const d = await sendDigest(demo, "evening", AT);
    expect(d?.status).toBe("skipped");
  });

  it("does not repeat stories the reader already received", async () => {
    const demo = await userByEmail(DEMO_EMAIL);
    const first = await sendDigest(demo, "evening", zonedToUtc("2026-10-05", "18:00", "Africa/Lagos"));
    const second = await sendDigest(demo, "morning", zonedToUtc("2026-10-06", "07:00", "Africa/Lagos"));
    const overlap = (second?.articleIds ?? []).filter((id) => first!.articleIds.includes(id));
    expect(overlap).toEqual([]);
  });
});

describe("runDueDigests", () => {
  it("sends due digests once, and skips paused and new users", async () => {
    const evening = zonedToUtc("2026-10-05", "18:05", "Africa/Lagos");
    const r1 = await runDueDigests(evening);
    expect(r1.sent).toBe(1); // demo only; Tunde is paused, Aisha not onboarded
    const r2 = await runDueDigests(evening);
    expect(r2.sent).toBe(0);
    const tunde = await userByEmail("tunde.bakare@example.ng");
    expect(await db.$count(digests, eq(digests.userId, tunde.id))).toBe(0);
  });

  it("sends nothing between slots", async () => {
    expect((await runDueDigests(AT)).sent).toBe(0);
  });
});

describe("scoping", () => {
  it("a user cannot open another user's email", async () => {
    const demo = await userByEmail(DEMO_EMAIL);
    const aisha = await userByEmail("aisha.bello@example.ng");
    const [d] = await db.select().from(digests).where(eq(digests.userId, demo.id)).limit(1);
    expect(await getDigest(demo.id, d.id)).not.toBeNull();
    expect(await getDigest(aisha.id, d.id)).toBeNull();
    expect(await listDigests(aisha.id)).toEqual([]);
  });

  it("the database blocks a duplicate digest for the same slot and day", async () => {
    const demo = await userByEmail(DEMO_EMAIL);
    const [d] = await db.select().from(digests).where(and(eq(digests.userId, demo.id), eq(digests.slot, "morning"))).limit(1);
    await expect(
      db.insert(digests).values({ userId: demo.id, slot: "morning", digestDate: d.digestDate, status: "sent", toEmail: demo.email, subject: "dup" }),
    ).rejects.toThrow();
    expect(await db.$count(interests, eq(interests.userId, demo.id))).toBe(4);
  });
});
