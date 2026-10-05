import { z } from "zod";
import { TOPIC_IDS } from "./topics";

const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a time in HH:MM format");

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(8, "Use at least 8 characters").max(100, "Password is too long"),
});

export const TIMEZONES = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Europe/London",
  "America/New_York",
] as const;

export const preferencesSchema = z
  .object({
    topics: z
      .array(z.enum(TOPIC_IDS))
      .min(1, "Pick at least one topic")
      .max(TOPIC_IDS.length),
    morningEnabled: z.boolean(),
    morningTime: timeField,
    eveningEnabled: z.boolean(),
    eveningTime: timeField,
    timezone: z.enum(TIMEZONES, "Pick a time zone from the list"),
  })
  .refine((v) => v.morningEnabled || v.eveningEnabled, {
    message: "Turn on at least one briefing",
    path: ["morningEnabled"],
  })
  .refine((v) => v.morningTime < "12:00", {
    message: "Morning briefing must be before 12:00",
    path: ["morningTime"],
  })
  .refine((v) => v.eveningTime >= "12:00", {
    message: "Evening briefing must be 12:00 or later",
    path: ["eveningTime"],
  });

export type Preferences = z.infer<typeof preferencesSchema>;

/** Reads the preferences form into the shape the schema expects. */
export function preferencesFromForm(form: FormData) {
  return {
    topics: form.getAll("topics").map(String),
    morningEnabled: form.get("morningEnabled") === "on",
    morningTime: String(form.get("morningTime") ?? ""),
    eveningEnabled: form.get("eveningEnabled") === "on",
    eveningTime: String(form.get("eveningTime") ?? ""),
    timezone: String(form.get("timezone") ?? ""),
  };
}

export type FieldErrors = Record<string, string[] | undefined>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
