const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&#8217;": "'",
  "&#8216;": "'",
  "&#8220;": '"',
  "&#8221;": '"',
  "&#8211;": "-",
  "&#8212;": "-",
  "&#8230;": "...",
  "&hellip;": "...",
};

/** Replaces typographic characters the house style does not allow. */
export function plainPunctuation(s: string): string {
  return s
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/ /g, " ");
}

export function stripHtml(html: string): string {
  return plainPunctuation(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&#?\w+;/g, (e) => ENTITIES[e] ?? " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/** Removes boilerplate such as "The post X appeared first on Y." */
export function cleanExcerpt(raw: string): string {
  return stripHtml(raw)
    .replace(/The post .* appeared first on .*\.?$/i, "")
    .replace(/\s+(Read More|Continue reading)\b.*$/i, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\[\s*\.\.\.\s*\]|\[\u2026\]/g, "...")
    .trim();
}

/**
 * Summary used when the AI model is unavailable: the first one or two
 * sentences of the excerpt, capped at a readable length.
 */
export function fallbackSummary(excerpt: string, maxChars = 240): string {
  const text = cleanExcerpt(excerpt);
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > maxChars && out) break;
    out += s;
    if (out.length >= maxChars * 0.6) break;
  }
  out = out.trim();
  if (out.length > maxChars) out = out.slice(0, maxChars - 3).replace(/\s+\S*$/, "") + "...";
  return out;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function relativeTime(then: Date, at: Date): string {
  const mins = Math.round((at.getTime() - then.getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function initials(source: string): string {
  const words = source.replace(/^The\s+/i, "").split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "?").toUpperCase() + (words[1]?.[0] ?? "").toUpperCase();
}
