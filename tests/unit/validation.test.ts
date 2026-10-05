import { describe, expect, it } from "vitest";
import { fieldErrors, preferencesFromForm, preferencesSchema, signInSchema, signUpSchema } from "@/lib/validation";

const good = { topics: ["nigeria"], morningEnabled: true, morningTime: "07:00", eveningEnabled: true, eveningTime: "18:00", timezone: "Africa/Lagos" };

describe("preferencesSchema", () => {
  it("accepts valid preferences", () => {
    expect(preferencesSchema.safeParse(good).success).toBe(true);
  });
  it("needs at least one topic", () => {
    const r = preferencesSchema.safeParse({ ...good, topics: [] });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).topics?.[0]).toBe("Pick at least one topic");
  });
  it("rejects unknown topics and time zones", () => {
    expect(preferencesSchema.safeParse({ ...good, topics: ["cooking"] }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...good, timezone: "Mars/Base" }).success).toBe(false);
  });
  it("needs at least one briefing turned on", () => {
    const r = preferencesSchema.safeParse({ ...good, morningEnabled: false, eveningEnabled: false });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).morningEnabled?.[0]).toBe("Turn on at least one briefing");
  });
  it("keeps morning before noon and evening after", () => {
    expect(preferencesSchema.safeParse({ ...good, morningTime: "13:00" }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...good, eveningTime: "09:00" }).success).toBe(false);
  });
  it("reads checkbox and select values from FormData", () => {
    const f = new FormData();
    f.append("topics", "nigeria");
    f.append("topics", "sports");
    f.set("morningEnabled", "on");
    f.set("morningTime", "06:30");
    f.set("eveningTime", "19:00");
    f.set("timezone", "Africa/Lagos");
    expect(preferencesFromForm(f)).toEqual({ topics: ["nigeria", "sports"], morningEnabled: true, morningTime: "06:30", eveningEnabled: false, eveningTime: "19:00", timezone: "Africa/Lagos" });
  });
});

describe("auth schemas", () => {
  it("normalises email and checks password length", () => {
    expect(signInSchema.parse({ email: " Demo@NewsInMail.ng ", password: "x" }).email).toBe("demo@newsinmail.ng");
    expect(signUpSchema.safeParse({ name: "Ada Obi", email: "ada@example.ng", password: "short" }).success).toBe(false);
    expect(signUpSchema.safeParse({ name: "A", email: "nope", password: "longenough" }).success).toBe(false);
  });
});
