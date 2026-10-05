export type RankableArticle = {
  id: number;
  topic: string;
  publishedAt: Date;
  isSample?: boolean;
};

export type SelectOptions = {
  now: Date;
  topics: readonly string[];
  excludeIds?: ReadonlySet<number>;
  maxAgeHours?: number;
  perTopic?: number;
  max?: number;
};

/**
 * Picks stories for a digest: only the reader's topics, only recent, never a
 * story they already received, newest first, and spread across topics with a
 * round-robin so one busy topic cannot fill the whole email.
 */
export function selectArticles<T extends RankableArticle>(articles: readonly T[], opts: SelectOptions): T[] {
  const { now, topics, excludeIds = new Set(), maxAgeHours = 36, perTopic = 3, max = 10 } = opts;
  const oldest = now.getTime() - maxAgeHours * 3_600_000;
  const wanted = new Set(topics);

  const fresh = articles
    .filter((a) => wanted.has(a.topic))
    .filter((a) => !excludeIds.has(a.id))
    .filter((a) => a.publishedAt.getTime() >= oldest && a.publishedAt.getTime() <= now.getTime() + 3_600_000)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime() || a.id - b.id);

  const byTopic = new Map<string, T[]>();
  for (const topic of topics) byTopic.set(topic, []);
  for (const a of fresh) {
    const list = byTopic.get(a.topic)!;
    if (list.length < perTopic) list.push(a);
  }

  const picked: T[] = [];
  for (let round = 0; round < perTopic && picked.length < max; round++) {
    for (const topic of topics) {
      const a = byTopic.get(topic)?.[round];
      if (a) picked.push(a);
      if (picked.length >= max) break;
    }
  }
  return picked;
}

/** Groups articles by topic, keeping the order the topics were given in. */
export function groupByTopic<T extends { topic: string }>(articles: readonly T[], order: readonly string[]) {
  return order
    .map((topic) => ({ topic, items: articles.filter((a) => a.topic === topic) }))
    .filter((g) => g.items.length > 0);
}
