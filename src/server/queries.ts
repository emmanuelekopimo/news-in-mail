import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { articles, digests } from "@/db/schema";

const FEED_HOURS = 72;

export async function feedForTopics(topics: string[], at: Date, limit = 60) {
  if (topics.length === 0) return [];
  return db
    .select()
    .from(articles)
    .where(and(inArray(articles.topic, topics), gte(articles.publishedAt, new Date(at.getTime() - FEED_HOURS * 3_600_000))))
    .orderBy(asc(articles.isSample), desc(articles.publishedAt))
    .limit(limit);
}

export async function searchArticles(q: string, limit = 40) {
  const term = `%${q.replace(/[%_]/g, "")}%`;
  return db
    .select()
    .from(articles)
    .where(or(ilike(articles.title, term), ilike(articles.excerpt, term), ilike(articles.source, term)))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

/** All digests for one user, newest first. Always scoped to the user. */
export async function listDigests(userId: number) {
  return db
    .select({
      id: digests.id,
      slot: digests.slot,
      digestDate: digests.digestDate,
      status: digests.status,
      subject: digests.subject,
      toEmail: digests.toEmail,
      deliveredVia: digests.deliveredVia,
      error: digests.error,
      articleIds: digests.articleIds,
      createdAt: digests.createdAt,
    })
    .from(digests)
    .where(eq(digests.userId, userId))
    .orderBy(desc(digests.createdAt), desc(digests.id));
}

export async function getDigest(userId: number, id: number) {
  const [row] = await db
    .select()
    .from(digests)
    .where(and(eq(digests.id, id), eq(digests.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function countDigestsSince(userId: number, since: Date) {
  const [row] = await db
    .select({ n: count() })
    .from(digests)
    .where(and(eq(digests.userId, userId), eq(digests.status, "sent"), gte(digests.createdAt, since)));
  return row?.n ?? 0;
}
