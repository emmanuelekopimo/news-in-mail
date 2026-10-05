import { and, eq, gte, inArray, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { articles, digests, interests, users, type Digest, type User } from "@/db/schema";
import { renderDigestEmail } from "@/lib/email";
import { selectArticles } from "@/lib/ranking";
import { dueSlots, localParts, nextDelivery, type Slot } from "@/lib/schedule";
import { fallbackSummary } from "@/lib/text";
import { TOPIC_IDS } from "@/lib/topics";
import { ingestAll } from "./ingest";
import { deliver } from "./mailer";
import { summarizeBatch } from "./openrouter";

export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return "http://localhost:3000";
}

export async function userTopics(userId: number): Promise<string[]> {
  const rows = await db.select({ topic: interests.topic }).from(interests).where(eq(interests.userId, userId));
  const set = new Set(rows.map((r) => r.topic));
  return TOPIC_IDS.filter((t) => set.has(t));
}

/** Stories this user already received in the last three days. */
async function recentlySentIds(userId: number, at: Date): Promise<Set<number>> {
  const rows = await db
    .select({ ids: digests.articleIds })
    .from(digests)
    .where(
      and(
        eq(digests.userId, userId),
        ne(digests.slot, "test"),
        eq(digests.status, "sent"),
        gte(digests.createdAt, new Date(at.getTime() - 3 * 86_400_000)),
      ),
    );
  return new Set(rows.flatMap((r) => r.ids));
}

/** Builds, summarises, delivers and records one digest for one user. */
export async function sendDigest(user: User, slot: Slot | "test", at: Date): Promise<Digest | null> {
  const topics = await userTopics(user.id);
  const { date } = localParts(at, user.timezone);
  const candidates = await db
    .select()
    .from(articles)
    .where(and(inArray(articles.topic, topics.length ? topics : ["none"]), gte(articles.publishedAt, new Date(at.getTime() - 48 * 3_600_000))));
  const exclude = slot === "test" ? new Set<number>() : await recentlySentIds(user.id, at);
  const picked = selectArticles(candidates, { now: at, topics, excludeIds: exclude, maxAgeHours: slot === "test" ? 48 : 36 });

  const slotLabel = slot === "test" ? "test briefing" : `${slot} briefing`;
  const needSummary = picked.filter((a) => !a.summary);
  let intro: string | null = null;
  if (needSummary.length > 0) {
    const result = await summarizeBatch(picked.map((a) => ({ id: a.id, title: a.title, source: a.source, excerpt: a.excerpt })), slotLabel);
    intro = result.intro;
    for (const a of picked) {
      const s = result.summaries.get(a.id);
      if (s && !a.summary) {
        a.summary = s;
        a.summaryModel = result.model;
        await db.update(articles).set({ summary: s, summaryModel: result.model }).where(eq(articles.id, a.id));
      }
    }
  }

  const prefs = user;
  const next = nextDelivery(at, prefs);
  const email = renderDigestEmail({
    name: user.name,
    slot,
    localDate: date,
    now: at,
    topics,
    intro: intro ?? undefined,
    appUrl: appUrl(),
    nextSend: next ? { slot: next.slot, time: next.time } : null,
    articles: picked.map((a) => ({ ...a, summary: a.summary ?? fallbackSummary(a.excerpt) ?? "" })),
  });

  if (picked.length === 0 && slot !== "test") {
    const [row] = await db
      .insert(digests)
      .values({ userId: user.id, slot, digestDate: date, status: "skipped", toEmail: user.email, subject: "Skipped: no new stories in your topics", createdAt: at })
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  }

  const delivery = await deliver(user.email, email);
  const [row] = await db
    .insert(digests)
    .values({
      userId: user.id,
      slot,
      digestDate: date,
      status: delivery.error ? "failed" : "sent",
      toEmail: user.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      articleIds: picked.map((a) => a.id),
      deliveredVia: delivery.via,
      error: delivery.error ?? null,
      createdAt: at,
    })
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

let running = false;

/** One scheduler tick: send every digest that is due right now. */
export async function runDueDigests(at: Date): Promise<{ sent: number; checked: number }> {
  if (running) return { sent: 0, checked: 0 };
  running = true;
  try {
    const active = await db
      .select()
      .from(users)
      .where(and(isNotNull(users.onboardedAt), eq(users.paused, false)));
    let sent = 0;
    let ingested = false;
    for (const user of active) {
      const { date } = localParts(at, user.timezone);
      const handled = await db
        .select({ slot: digests.slot })
        .from(digests)
        .where(and(eq(digests.userId, user.id), eq(digests.digestDate, date)));
      const due = dueSlots(at, user, new Set(handled.map((h) => h.slot as Slot)));
      for (const d of due) {
        if (!ingested) {
          await ingestAll(at).catch((e) => console.warn("[ingest]", e));
          ingested = true;
        }
        const row = await sendDigest(user, d.slot, at);
        if (row) sent++;
      }
    }
    return { sent, checked: active.length };
  } finally {
    running = false;
  }
}
