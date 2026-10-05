import { describe, expect, it } from "vitest";
import { digestSubject, formatLongDate, renderDigestEmail } from "@/lib/email";

const now = new Date("2026-10-05T06:00:00Z");
const base = {
  name: "Chiamaka Okafor",
  slot: "morning" as const,
  localDate: "2026-10-05",
  now,
  topics: ["nigeria", "sports"],
  appUrl: "https://example.app",
  nextSend: { slot: "evening" as const, time: "18:00" },
  articles: [
    { id: 1, topic: "sports", source: "BBC Sport", title: "Eagles win <big>", link: "https://x.test/1", summary: "A good game.", publishedAt: new Date("2026-10-05T05:00:00Z") },
    { id: 2, topic: "nigeria", source: "Punch", title: "Lagos news", link: "https://x.test/2", summary: "Something happened.", publishedAt: new Date("2026-10-05T04:00:00Z") },
  ],
};

describe("renderDigestEmail", () => {
  it("builds subject, greeting and topic sections in the reader's order", () => {
    const mail = renderDigestEmail(base);
    expect(mail.subject).toBe("Morning briefing for Monday: 2 stories");
    expect(mail.html).toContain("Good morning, Chiamaka");
    expect(mail.html.indexOf("Nigeria")).toBeLessThan(mail.html.indexOf("Sports"));
    expect(mail.html).toContain("https://example.app/settings");
    expect(mail.text).toContain("Next briefing: evening at 6:00 PM.");
  });
  it("escapes headlines", () => {
    expect(renderDigestEmail(base).html).toContain("Eagles win &lt;big&gt;");
  });
  it("uses the AI intro when given", () => {
    expect(renderDigestEmail({ ...base, intro: "Big day for sport." }).html).toContain("Big day for sport.");
  });
  it("explains an empty digest", () => {
    expect(renderDigestEmail({ ...base, articles: [] }).html).toContain("No new stories in your topics");
  });
  it("labels test emails", () => {
    expect(digestSubject("test", "2026-10-05", 5)).toBe("Your test briefing: 5 stories picked for you");
    expect(renderDigestEmail({ ...base, slot: "test" }).html).toContain("This is a test email");
  });
  it("contains no em dashes, en dashes or curly quotes", () => {
    const { html, text } = renderDigestEmail(base);
    expect(html + text).not.toMatch(/[–—‘’“”]/);
  });
  it("formats long dates", () => {
    expect(formatLongDate("2026-10-05")).toBe("Monday 5 October 2026".replace("Monday ", "Monday, "));
  });
});
