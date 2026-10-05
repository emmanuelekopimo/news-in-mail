import { describe, expect, it } from "vitest";
import { groupByTopic, selectArticles } from "@/lib/ranking";

const now = new Date("2026-10-05T12:00:00Z");
const art = (id: number, topic: string, hoursAgo: number) => ({ id, topic, publishedAt: new Date(now.getTime() - hoursAgo * 3_600_000) });

describe("selectArticles", () => {
  const pool = [
    art(1, "nigeria", 1), art(2, "nigeria", 2), art(3, "nigeria", 3), art(4, "nigeria", 4),
    art(5, "sports", 1), art(6, "sports", 5),
    art(7, "world", 1),
    art(8, "nigeria", 50),
  ];

  it("only includes the reader's topics", () => {
    const picked = selectArticles(pool, { now, topics: ["sports"] });
    expect(picked.map((a) => a.id)).toEqual([5, 6]);
  });

  it("drops stories older than the window", () => {
    const picked = selectArticles(pool, { now, topics: ["nigeria"], perTopic: 10 });
    expect(picked.map((a) => a.id)).not.toContain(8);
  });

  it("never repeats stories already sent", () => {
    const picked = selectArticles(pool, { now, topics: ["nigeria"], excludeIds: new Set([1, 2]) });
    expect(picked.map((a) => a.id)).toEqual([3, 4]);
  });

  it("spreads picks across topics with a round-robin", () => {
    const picked = selectArticles(pool, { now, topics: ["nigeria", "sports"], perTopic: 3, max: 4 });
    expect(picked.map((a) => a.id)).toEqual([1, 5, 2, 6]);
  });

  it("caps the total and the per-topic count", () => {
    expect(selectArticles(pool, { now, topics: ["nigeria", "sports", "world"], max: 3 })).toHaveLength(3);
    expect(selectArticles(pool, { now, topics: ["nigeria"], perTopic: 2 })).toHaveLength(2);
  });

  it("returns nothing when no topics are followed", () => {
    expect(selectArticles(pool, { now, topics: [] })).toEqual([]);
  });
});

describe("groupByTopic", () => {
  it("keeps topic order and skips empty groups", () => {
    const groups = groupByTopic([art(1, "b", 1), art(2, "a", 1)], ["a", "c", "b"]);
    expect(groups.map((g) => g.topic)).toEqual(["a", "b"]);
  });
});
