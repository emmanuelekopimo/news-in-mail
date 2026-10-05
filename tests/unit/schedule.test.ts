import { describe, expect, it } from "vitest";
import { CATCH_UP_MINUTES, dueSlots, formatTime12, greeting, localParts, nextDelivery, parseTime, shiftDate, zonedToUtc, type DeliveryPrefs } from "@/lib/schedule";

const prefs: DeliveryPrefs = { timezone: "Africa/Lagos", morningEnabled: true, morningTime: "07:00", eveningEnabled: true, eveningTime: "18:00", paused: false };
// Lagos is UTC+1 all year.
const lagos = (date: string, time: string) => new Date(`${date}T${time}:00+01:00`);

describe("parseTime", () => {
  it("parses HH:MM into minutes", () => {
    expect(parseTime("07:30")).toBe(450);
    expect(parseTime("0:05")).toBe(5);
  });
  it("rejects invalid times", () => {
    expect(() => parseTime("24:00")).toThrow();
    expect(() => parseTime("7am")).toThrow();
  });
});

describe("localParts", () => {
  it("converts UTC to Lagos local date and minutes", () => {
    expect(localParts(new Date("2026-10-05T23:30:00Z"), "Africa/Lagos")).toEqual({ date: "2026-10-06", minutes: 30 });
  });
});

describe("dueSlots", () => {
  it("sends nothing before the morning time", () => {
    expect(dueSlots(lagos("2026-10-05", "06:59"), prefs, new Set())).toEqual([]);
  });
  it("sends the morning digest once its time has passed", () => {
    expect(dueSlots(lagos("2026-10-05", "07:04"), prefs, new Set())).toEqual([{ slot: "morning", date: "2026-10-05" }]);
  });
  it("does not resend a slot already handled today", () => {
    expect(dueSlots(lagos("2026-10-05", "07:04"), prefs, new Set(["morning"]))).toEqual([]);
  });
  it("gives up after the catch-up window", () => {
    const late = new Date(lagos("2026-10-05", "07:00").getTime() + (CATCH_UP_MINUTES + 1) * 60_000);
    expect(dueSlots(late, prefs, new Set())).toEqual([]);
  });
  it("sends the evening digest in the evening", () => {
    expect(dueSlots(lagos("2026-10-05", "18:10"), prefs, new Set(["morning"]))).toEqual([{ slot: "evening", date: "2026-10-05" }]);
  });
  it("respects pause and disabled slots", () => {
    expect(dueSlots(lagos("2026-10-05", "07:10"), { ...prefs, paused: true }, new Set())).toEqual([]);
    expect(dueSlots(lagos("2026-10-05", "07:10"), { ...prefs, morningEnabled: false }, new Set())).toEqual([]);
  });
  it("uses the reader's own time zone", () => {
    const london = { ...prefs, timezone: "Europe/London" };
    // 07:05 in Lagos is 07:05 in London during BST (both UTC+1) but 06:05 in winter.
    expect(dueSlots(new Date("2026-12-01T06:05:00Z"), london, new Set())).toEqual([]);
    expect(dueSlots(new Date("2026-12-01T07:05:00Z"), london, new Set())).toHaveLength(1);
  });
});

describe("nextDelivery", () => {
  it("returns the next slot today", () => {
    expect(nextDelivery(lagos("2026-10-05", "09:00"), prefs)).toEqual({ slot: "evening", time: "18:00", day: "today" });
  });
  it("rolls over to tomorrow morning", () => {
    expect(nextDelivery(lagos("2026-10-05", "20:00"), prefs)).toEqual({ slot: "morning", time: "07:00", day: "tomorrow" });
  });
  it("returns null when paused or nothing is enabled", () => {
    expect(nextDelivery(lagos("2026-10-05", "09:00"), { ...prefs, paused: true })).toBeNull();
    expect(nextDelivery(lagos("2026-10-05", "09:00"), { ...prefs, morningEnabled: false, eveningEnabled: false })).toBeNull();
  });
});

describe("helpers", () => {
  it("zonedToUtc finds the UTC instant for a local time", () => {
    expect(zonedToUtc("2026-10-05", "07:00", "Africa/Lagos").toISOString()).toBe("2026-10-05T06:00:00.000Z");
    expect(zonedToUtc("2026-10-05", "07:00", "America/New_York").toISOString()).toBe("2026-10-05T11:00:00.000Z");
  });
  it("shiftDate moves across month ends", () => {
    expect(shiftDate("2026-10-01", -1)).toBe("2026-09-30");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("formats 12-hour times", () => {
    expect(formatTime12("07:00")).toBe("7:00 AM");
    expect(formatTime12("18:30")).toBe("6:30 PM");
    expect(formatTime12("00:15")).toBe("12:15 AM");
  });
  it("greets by slot", () => {
    expect(greeting("morning", "Ada")).toBe("Good morning, Ada");
    expect(greeting("evening", "Ada")).toBe("Good evening, Ada");
    expect(greeting("test", "Ada")).toBe("Hello, Ada");
  });
});
