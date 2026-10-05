import { describe, expect, it } from "vitest";
import { cleanExcerpt, escapeHtml, fallbackSummary, firstName, initials, plainPunctuation, relativeTime, stripHtml } from "@/lib/text";

describe("text helpers", () => {
  it("strips HTML and decodes entities", () => {
    expect(stripHtml("<p>Fish &amp; chips <b>today</b></p>")).toBe("Fish & chips today");
  });
  it("replaces typographic punctuation with plain ASCII", () => {
    expect(plainPunctuation("“Hi” — it’s fine…")).toBe('"Hi" - it\'s fine...');
  });
  it("removes feed boilerplate without cutting normal words", () => {
    expect(cleanExcerpt("Prices fell. Read More: https://example.com/x")).toBe("Prices fell.");
    expect(cleanExcerpt("The post Hello appeared first on Example.")).toBe("");
    expect(cleanExcerpt("They already read the report.")).toBe("They already read the report.");
  });
  it("builds a short fallback summary from the first sentences", () => {
    const s = fallbackSummary("One. Two is here. Three is a much longer sentence that goes on and on and on and on and on.", 40);
    expect(s).toBe("One. Two is here.");
    expect(fallbackSummary("")).toBe("");
    expect(fallbackSummary("x".repeat(500), 100).length).toBeLessThanOrEqual(100);
  });
  it("escapes HTML", () => {
    expect(escapeHtml(`<a href="x">'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&lt;/a&gt;");
  });
  it("formats relative times", () => {
    const now = new Date("2026-10-05T12:00:00Z");
    expect(relativeTime(new Date("2026-10-05T11:59:40Z"), now)).toBe("Just now");
    expect(relativeTime(new Date("2026-10-05T11:15:00Z"), now)).toBe("45 min ago");
    expect(relativeTime(new Date("2026-10-05T11:00:00Z"), now)).toBe("1 hour ago");
    expect(relativeTime(new Date("2026-10-04T10:00:00Z"), now)).toBe("Yesterday");
    expect(relativeTime(new Date("2026-10-01T10:00:00Z"), now)).toBe("4 days ago");
  });
  it("derives initials and first names", () => {
    expect(initials("The Guardian")).toBe("G");
    expect(initials("BBC News")).toBe("BN");
    expect(firstName("Chiamaka Okafor")).toBe("Chiamaka");
  });
});
