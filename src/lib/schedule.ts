export type Slot = "morning" | "evening";

export type DeliveryPrefs = {
  timezone: string;
  morningEnabled: boolean;
  morningTime: string; // "HH:MM"
  eveningEnabled: boolean;
  eveningTime: string;
  paused: boolean;
};

/** How late a digest may still go out after its scheduled time. */
export const CATCH_UP_MINUTES = 180;

export function parseTime(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`Invalid time: ${hhmm}`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) throw new Error(`Invalid time: ${hhmm}`);
  return h * 60 + min;
}

/** Local calendar date (YYYY-MM-DD) and minutes since local midnight. */
export function localParts(at: Date, timezone: string): { date: string; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function enabledSlots(prefs: DeliveryPrefs): { slot: Slot; minutes: number }[] {
  const list: { slot: Slot; minutes: number }[] = [];
  if (prefs.morningEnabled) list.push({ slot: "morning", minutes: parseTime(prefs.morningTime) });
  if (prefs.eveningEnabled) list.push({ slot: "evening", minutes: parseTime(prefs.eveningTime) });
  return list.sort((a, b) => a.minutes - b.minutes);
}

/**
 * Which digests should be sent right now. A slot is due when its local time
 * has passed today, it is within the catch-up window, and it has not already
 * been handled today (sent, failed or skipped).
 */
export function dueSlots(
  at: Date,
  prefs: DeliveryPrefs,
  handledToday: ReadonlySet<Slot>,
): { slot: Slot; date: string }[] {
  if (prefs.paused) return [];
  const { date, minutes } = localParts(at, prefs.timezone);
  return enabledSlots(prefs)
    .filter((s) => minutes >= s.minutes && minutes - s.minutes <= CATCH_UP_MINUTES)
    .filter((s) => !handledToday.has(s.slot))
    .map((s) => ({ slot: s.slot, date }));
}

/** The next scheduled digest, as a slot plus "today" or "tomorrow". */
export function nextDelivery(
  at: Date,
  prefs: DeliveryPrefs,
): { slot: Slot; time: string; day: "today" | "tomorrow" } | null {
  if (prefs.paused) return null;
  const slots = enabledSlots(prefs);
  if (slots.length === 0) return null;
  const { minutes } = localParts(at, prefs.timezone);
  const later = slots.find((s) => s.minutes > minutes);
  const pick = later ?? slots[0];
  const time = pick.slot === "morning" ? prefs.morningTime : prefs.eveningTime;
  return { slot: pick.slot, time, day: later ? "today" : "tomorrow" };
}

export function formatTime12(hhmm: string): string {
  const total = parseTime(hhmm);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function greeting(slot: Slot | "test", firstName: string): string {
  if (slot === "morning") return `Good morning, ${firstName}`;
  if (slot === "evening") return `Good evening, ${firstName}`;
  return `Hello, ${firstName}`;
}

/** Converts a local date and time in a time zone to the matching UTC instant. */
export function zonedToUtc(localDate: string, hhmm: string, timezone: string): Date {
  const target = parseTime(hhmm);
  let guess = new Date(`${localDate}T${hhmm}:00Z`);
  for (let i = 0; i < 3; i++) {
    const p = localParts(guess, timezone);
    const dayDiff = Math.round((Date.parse(`${localDate}T00:00:00Z`) - Date.parse(`${p.date}T00:00:00Z`)) / 86_400_000);
    const diff = dayDiff * 1440 + (target - p.minutes);
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff * 60_000);
  }
  return guess;
}

/** Shifts a YYYY-MM-DD string by a number of days. */
export function shiftDate(localDate: string, days: number): string {
  const d = new Date(`${localDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
