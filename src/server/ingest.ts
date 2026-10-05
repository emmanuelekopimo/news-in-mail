import { lt, sql } from "drizzle-orm";
import Parser from "rss-parser";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { cleanExcerpt, plainPunctuation } from "@/lib/text";
import { TOPICS, type TopicId } from "@/lib/topics";

const parser = new Parser({ timeout: 15_000 });
const PER_FEED = 15;
const KEEP_DAYS = 14;

type NewArticle = typeof articles.$inferInsert;

export async function fetchFeed(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "NewsInMail/1.0 (student project; RSS reader)" },
    signal: AbortSignal.timeout(15_000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function parseFeed(xml: string, topic: TopicId, source: string, at: Date): Promise<NewArticle[]> {
  const feed = await parser.parseString(xml);
  return feed.items
    .filter((i) => i.link && i.title)
    .slice(0, PER_FEED)
    .map((i) => {
      const published = new Date(i.isoDate ?? i.pubDate ?? at.toISOString());
      return {
        link: i.link!.trim(),
        topic,
        source,
        title: plainPunctuation(cleanExcerpt(i.title!)),
        excerpt: cleanExcerpt(i.contentSnippet ?? i.content ?? i.summary ?? "").slice(0, 1200),
        publishedAt: Number.isNaN(published.getTime()) || published > at ? at : published,
        fetchedAt: at,
      };
    });
}

let lastIngest = 0;

/** Fetches every feed and stores new stories. Safe to call often. */
export async function ingestAll(at: Date, opts: { force?: boolean } = {}) {
  if (process.env.NEWSINMAIL_OFFLINE === "1") return { added: 0, failed: 0, skipped: true };
  if (!opts.force && Date.now() - lastIngest < 20 * 60_000) return { added: 0, failed: 0, skipped: true };
  lastIngest = Date.now();

  const jobs = TOPICS.flatMap((t) => t.feeds.map((f) => ({ topic: t.id, ...f })));
  const results = await Promise.allSettled(
    jobs.map(async (j) => parseFeed(await fetchFeed(j.url), j.topic, j.source, at)),
  );
  let added = 0;
  let failed = 0;
  for (const [i, r] of results.entries()) {
    if (r.status === "rejected") {
      failed++;
      console.warn(`[ingest] ${jobs[i].url}: ${(r.reason as Error).message}`);
      continue;
    }
    if (r.value.length === 0) continue;
    const inserted = await db
      .insert(articles)
      .values(r.value)
      .onConflictDoNothing({ target: articles.link })
      .returning({ id: articles.id });
    added += inserted.length;
  }
  await db.delete(articles).where(lt(articles.publishedAt, new Date(at.getTime() - KEEP_DAYS * 86_400_000)));
  console.log(`[ingest] added ${added} stories, ${failed} feeds failed`);
  return { added, failed, skipped: false };
}

export async function latestFetch(): Promise<Date | null> {
  const [row] = await db
    .select({ at: sql<Date>`max(${articles.fetchedAt})` })
    .from(articles);
  return row?.at ? new Date(row.at) : null;
}
