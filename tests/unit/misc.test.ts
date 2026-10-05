import { describe, expect, it } from "vitest";
import { signSession, verifySession } from "@/lib/session-token";
import { resolveNow } from "@/lib/today";
import { getTopic, isTopicId, TOPICS } from "@/lib/topics";
import { parseSummaryJson } from "@/server/openrouter";

describe("resolveNow", () => {
  const real = new Date("2026-03-01T09:15:00Z");
  it("uses the real clock by default", () => {
    expect(resolveNow({}, real)).toEqual(real);
  });
  it("pins the date with NEWSINMAIL_TODAY but keeps the time of day", () => {
    expect(resolveNow({ NEWSINMAIL_TODAY: "2026-10-05" }, real).toISOString()).toBe("2026-10-05T09:15:00.000Z");
  });
  it("prefers a full NEWSINMAIL_NOW and ignores bad values", () => {
    expect(resolveNow({ NEWSINMAIL_NOW: "2026-10-05T06:00:00Z" }, real).toISOString()).toBe("2026-10-05T06:00:00.000Z");
    expect(resolveNow({ NEWSINMAIL_TODAY: "05/10/2026" }, real)).toEqual(real);
  });
});

describe("session tokens", () => {
  it("round-trips a user id and rejects tampering", async () => {
    const token = await signSession(42, "a-very-long-test-secret-value");
    expect(await verifySession(token, "a-very-long-test-secret-value")).toBe(42);
    expect(await verifySession(token, "another-long-secret-value-xx")).toBeNull();
    expect(await verifySession(token.slice(0, -2) + "xx", "a-very-long-test-secret-value")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });
});

describe("topics", () => {
  it("every topic has at least one feed and a unique id", () => {
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
    for (const t of TOPICS) expect(t.feeds.length).toBeGreaterThan(0);
    expect(isTopicId("nigeria")).toBe(true);
    expect(isTopicId("cooking")).toBe(false);
    expect(getTopic("sports")?.label).toBe("Sports");
  });
});

describe("parseSummaryJson", () => {
  it("parses model JSON wrapped in a code fence and cleans punctuation", () => {
    const r = parseSummaryJson('```json\n{"intro":"Busy day — lots on.","summaries":[{"id":3,"summary":"It’s done."},{"id":"x","summary":"bad"}]}\n```');
    expect(r.intro).toBe("Busy day - lots on.");
    expect(r.summaries.get(3)).toBe("It's done.");
    expect(r.summaries.size).toBe(1);
  });
  it("returns empty results for junk", () => {
    expect(parseSummaryJson("sorry, no").summaries.size).toBe(0);
  });
});
