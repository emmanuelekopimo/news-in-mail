/**
 * Clock helpers. Set NEWSINMAIL_TODAY=YYYY-MM-DD to pin "today" for demos and
 * tests. The time of day still comes from the real clock unless NEWSINMAIL_NOW
 * (a full ISO timestamp) is set.
 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function resolveNow(env: Record<string, string | undefined>, real: Date = new Date()): Date {
  if (env.NEWSINMAIL_NOW) {
    const d = new Date(env.NEWSINMAIL_NOW);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const today = env.NEWSINMAIL_TODAY;
  if (today && DATE_RE.test(today)) {
    const time = real.toISOString().slice(10); // "THH:MM:SS.sssZ"
    return new Date(`${today}${time}`);
  }
  return real;
}

export function now(): Date {
  return resolveNow(process.env);
}

export function addHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 3_600_000);
}

export function addDays(d: Date, days: number): Date {
  return addHours(d, days * 24);
}
