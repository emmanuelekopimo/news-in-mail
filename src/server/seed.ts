import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import type { Db } from "@/db";
import { articles, digests, interests, users } from "@/db/schema";
import { renderDigestEmail } from "@/lib/email";
import { selectArticles } from "@/lib/ranking";
import { localParts, nextDelivery, shiftDate, zonedToUtc, type Slot } from "@/lib/schedule";
import { fallbackSummary } from "@/lib/text";
import { SEED_ARTICLES, SEED_USERS } from "./seed-data";

const TZ = "Africa/Lagos";

/** Wipes all tables and loads demo data dated relative to `at`. */
export async function seedDatabase(db: Db, at: Date, appUrl = "http://localhost:3000") {
  await db.execute(sql`TRUNCATE digests, interests, articles, users RESTART IDENTITY CASCADE`);

  const insertedArticles = await db
    .insert(articles)
    .values(
      SEED_ARTICLES.map((a, i) => ({
        link: `https://example.com/sample/${a.topic}/${i + 1}`,
        topic: a.topic,
        source: a.source,
        title: a.title,
        excerpt: a.excerpt,
        summary: a.summary,
        summaryModel: a.summary ? "sample" : null,
        isSample: true,
        publishedAt: new Date(at.getTime() - a.hoursAgo * 3_600_000),
        fetchedAt: at,
      })),
    )
    .returning();

  const today = localParts(at, TZ).date;
  const created = [];
  for (const u of SEED_USERS) {
    const [user] = await db
      .insert(users)
      .values({
        name: u.name,
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 10),
        timezone: TZ,
        paused: u.paused ?? false,
        morningTime: u.morningTime ?? "07:00",
        eveningTime: u.eveningTime ?? "18:00",
        onboardedAt: u.onboarded ? zonedToUtc(shiftDate(today, -5), "20:15", TZ) : null,
        createdAt: zonedToUtc(shiftDate(today, -5), "20:00", TZ),
      })
      .returning();
    if (u.topics.length) await db.insert(interests).values(u.topics.map((topic) => ({ userId: user.id, topic })));
    created.push({ user, seed: u });
  }

  // Digest history for the demo user: mostly sent, plus one failed and one skipped.
  const { user: demo, seed: demoSeed } = created[0];
  const history: { date: string; slot: Slot | "test"; time: string; status: "sent" | "failed" | "skipped" }[] = [
    { date: shiftDate(today, -5), slot: "test", time: "20:16", status: "sent" },
  ];
  for (let back = 4; back >= 0; back--) {
    const date = shiftDate(today, -back);
    for (const [slot, time] of [["morning", "07:00"], ["evening", "18:00"]] as const) {
      let status: "sent" | "failed" | "skipped" = "sent";
      if (back === 2 && slot === "evening") status = "failed";
      if (back === 3 && slot === "morning") status = "skipped";
      history.push({ date, slot, time, status });
    }
  }

  for (const h of history) {
    const sentAt = zonedToUtc(h.date, h.time, TZ);
    if (sentAt > at) continue;
    if (h.status === "skipped") {
      await db.insert(digests).values({ userId: demo.id, slot: h.slot, digestDate: h.date, status: "skipped", toEmail: demo.email, subject: "Skipped: no new stories in your topics", createdAt: sentAt });
      continue;
    }
    // Shift sample stories so they look fresh relative to the send time.
    const shifted = insertedArticles.map((a) => ({ ...a, publishedAt: new Date(a.publishedAt.getTime() - (at.getTime() - sentAt.getTime())) }));
    const picked = selectArticles(shifted, { now: sentAt, topics: demoSeed.topics, max: 8 });
    const next = nextDelivery(new Date(sentAt.getTime() + 60_000), demo);
    const email = renderDigestEmail({
      name: demo.name,
      slot: h.slot,
      localDate: h.date,
      now: sentAt,
      topics: demoSeed.topics,
      appUrl,
      nextSend: next ? { slot: next.slot, time: next.time } : null,
      articles: picked.map((a) => ({ ...a, summary: a.summary ?? fallbackSummary(a.excerpt) })),
    });
    await db.insert(digests).values({
      userId: demo.id,
      slot: h.slot,
      digestDate: h.date,
      status: h.status,
      toEmail: demo.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      articleIds: picked.map((a) => a.id),
      deliveredVia: h.status === "failed" ? "smtp" : "inbox",
      error: h.status === "failed" ? "SMTP timeout: the mail server did not respond within 30 seconds" : null,
      createdAt: sentAt,
    });
  }

  return { users: created.length, articles: insertedArticles.length };
}
