import { groupByTopic } from "./ranking";
import { formatTime12, greeting, type Slot } from "./schedule";
import { escapeHtml, firstName, relativeTime } from "./text";
import { getTopic } from "./topics";

export type EmailArticle = {
  id: number;
  topic: string;
  source: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: Date;
};

export type DigestInput = {
  name: string;
  slot: Slot | "test";
  localDate: string; // YYYY-MM-DD
  now: Date;
  topics: readonly string[];
  articles: readonly EmailArticle[];
  intro?: string;
  appUrl: string;
  nextSend?: { slot: Slot; time: string } | null;
};

export type RenderedEmail = { subject: string; html: string; text: string };

export function formatLongDate(localDate: string): string {
  const d = new Date(`${localDate}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function digestSubject(slot: Slot | "test", localDate: string, count: number): string {
  const day = formatLongDate(localDate).split(",")[0];
  if (slot === "test") return `Your test briefing: ${count} stories picked for you`;
  const label = slot === "morning" ? "Morning" : "Evening";
  return `${label} briefing for ${day}: ${count} stories`;
}

export function renderDigestEmail(input: DigestInput): RenderedEmail {
  const { name, slot, localDate, now, topics, articles, appUrl } = input;
  const subject = digestSubject(slot, localDate, articles.length);
  const hello = greeting(slot, firstName(name));
  const dateLine = formatLongDate(localDate);
  const intro =
    input.intro?.trim() ||
    (slot === "test"
      ? "This is a test email. Your real briefings will look like this."
      : `Here are the ${articles.length} stories worth your time.`);
  const groups = groupByTopic(articles, topics);
  const settingsUrl = `${appUrl.replace(/\/$/, "")}/settings`;
  const followed = topics.map((t) => getTopic(t)?.label ?? t).join(", ");
  const next =
    input.nextSend != null
      ? `Next briefing: ${input.nextSend.slot} at ${formatTime12(input.nextSend.time)}.`
      : "";

  const sections = groups
    .map((g) => {
      const topic = getTopic(g.topic);
      const color = topic?.color ?? "#1a73e8";
      const items = g.items
        .map(
          (a) => `
          <tr><td style="padding:14px 0;border-top:1px solid #e8eaed;">
            <div style="font-size:12px;color:#5f6368;margin-bottom:4px;">${escapeHtml(a.source)} &middot; ${escapeHtml(relativeTime(a.publishedAt, now))}</div>
            <a href="${escapeHtml(a.link)}" style="font-size:17px;line-height:1.35;color:#202124;text-decoration:none;font-weight:500;">${escapeHtml(a.title)}</a>
            <div style="font-size:14px;line-height:1.55;color:#3c4043;margin-top:6px;">${escapeHtml(a.summary)}</div>
          </td></tr>`,
        )
        .join("");
      return `
        <tr><td style="padding:22px 24px 4px;">
          <div style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${color};">${escapeHtml(topic?.label ?? g.topic)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
        </td></tr>`;
    })
    .join("");

  const empty =
    articles.length === 0
      ? `<tr><td style="padding:24px;font-size:15px;color:#3c4043;">No new stories in your topics since the last briefing. We will try again at the next one.</td></tr>`
      : "";

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f1f3f4;font-family:Roboto,Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f4;padding:24px 8px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr><td style="padding:20px 24px;border-bottom:1px solid #e8eaed;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="width:28px;height:28px;background:#1a73e8;border-radius:7px;color:#fff;font-weight:700;font-size:14px;text-align:center;vertical-align:middle;">N</td>
      <td style="padding-left:10px;font-size:18px;color:#202124;"><b>News</b> in Mail</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:24px 24px 0;">
    <div style="font-size:13px;color:#5f6368;">${escapeHtml(dateLine)}</div>
    <h1 style="margin:6px 0 8px;font-size:24px;font-weight:400;color:#202124;">${escapeHtml(hello)}</h1>
    <p style="margin:0;font-size:15px;line-height:1.55;color:#3c4043;">${escapeHtml(intro)}</p>
  </td></tr>
  ${sections}${empty}
  <tr><td style="padding:24px;background:#f8f9fa;font-size:12px;line-height:1.6;color:#5f6368;">
    You follow: ${escapeHtml(followed)}. ${escapeHtml(next)}<br>
    Summaries are written by AI from free news feeds. Tap a headline to read the full story at the source.<br>
    <a href="${escapeHtml(settingsUrl)}" style="color:#1a73e8;">Change topics or delivery times</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const textSections = groups
    .map((g) => {
      const label = (getTopic(g.topic)?.label ?? g.topic).toUpperCase();
      const items = g.items
        .map((a) => `- ${a.title} (${a.source})\n  ${a.summary}\n  ${a.link}`)
        .join("\n\n");
      return `${label}\n\n${items}`;
    })
    .join("\n\n");

  const text = [
    `NEWS IN MAIL - ${dateLine}`,
    "",
    hello,
    intro,
    "",
    textSections || "No new stories in your topics since the last briefing.",
    "",
    `You follow: ${followed}. ${next}`.trim(),
    `Change topics or delivery times: ${settingsUrl}`,
  ].join("\n");

  return { subject, html, text };
}
