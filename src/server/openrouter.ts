import { plainPunctuation } from "@/lib/text";

export const PRIMARY_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-5.5";
export const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL ?? "google/gemini-3.8-flash";

export type SummaryRequest = { id: number; title: string; source: string; excerpt: string };
export type SummaryResult = {
  intro: string | null;
  summaries: Map<number, string>;
  model: string | null;
};

const SYSTEM = `You are the editor of a short news briefing email.
For each article, write a neutral, factual summary of at most 2 sentences and 45 words, using only the title and excerpt given. Do not invent facts.
Also write "intro": one friendly sentence (max 30 words) previewing the main themes.
Use plain ASCII punctuation only: no em dashes, en dashes, curly quotes or emojis.
Reply with JSON only: {"intro": string, "summaries": [{"id": number, "summary": string}]}`;

export function aiEnabled(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY) && process.env.NEWSINMAIL_OFFLINE !== "1";
}

/** Summarises a batch of articles in one request. Returns empty results on any failure. */
export async function summarizeBatch(items: SummaryRequest[], slotLabel: string): Promise<SummaryResult> {
  const empty: SummaryResult = { intro: null, summaries: new Map(), model: null };
  if (!aiEnabled() || items.length === 0) return empty;

  const user = JSON.stringify({
    briefing: slotLabel,
    articles: items.map((i) => ({ id: i.id, source: i.source, title: i.title, excerpt: i.excerpt.slice(0, 700) })),
  });

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "News in Mail",
      },
      body: JSON.stringify({
        models: [PRIMARY_MODEL, FALLBACK_MODEL],
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.warn(`[openrouter] HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return empty;
    }
    const body = (await res.json()) as { model?: string; choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content ?? "";
    const parsed = parseSummaryJson(content);
    return { ...parsed, model: body.model ?? PRIMARY_MODEL };
  } catch (err) {
    console.warn("[openrouter] request failed:", (err as Error).message);
    return empty;
  }
}

/** Parses the model reply, tolerating code fences or text around the JSON. */
export function parseSummaryJson(content: string): { intro: string | null; summaries: Map<number, string> } {
  const summaries = new Map<number, string>();
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start < 0 || end <= start) return { intro: null, summaries };
  try {
    const data = JSON.parse(content.slice(start, end + 1)) as {
      intro?: unknown;
      summaries?: { id?: unknown; summary?: unknown }[];
    };
    for (const s of data.summaries ?? []) {
      const id = Number(s.id);
      if (Number.isInteger(id) && typeof s.summary === "string" && s.summary.trim()) {
        summaries.set(id, plainPunctuation(s.summary.trim()));
      }
    }
    const intro = typeof data.intro === "string" && data.intro.trim() ? plainPunctuation(data.intro.trim()) : null;
    return { intro, summaries };
  } catch {
    return { intro: null, summaries };
  }
}
