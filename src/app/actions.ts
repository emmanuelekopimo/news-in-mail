"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { interests, users } from "@/db/schema";
import { now } from "@/lib/today";
import { fieldErrors, preferencesFromForm, preferencesSchema, signInSchema, signUpSchema, type FieldErrors } from "@/lib/validation";
import { checkPassword, endSession, hashPassword, requireUser, startSession } from "@/server/auth";
import { sendDigest } from "@/server/digest";
import { ingestAll } from "@/server/ingest";

export type FormState = {
  errors?: FieldErrors;
  message?: string;
  values?: Record<string, unknown>;
  ok?: boolean;
};

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") };
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { email: raw.email } };
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!user || !(await checkPassword(parsed.data.password, user.passwordHash))) {
    return { message: "Wrong email or password", values: { email: raw.email } };
  }
  await startSession(user.id);
  redirect(user.onboardedAt ? "/news" : "/onboarding");
}

export async function signUpAction(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  };
  const values = { name: raw.name, email: raw.email };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing) return { errors: { email: ["An account with this email already exists"] }, values };
  const [user] = await db
    .insert(users)
    .values({ name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password), createdAt: now() })
    .returning();
  await startSession(user.id);
  redirect("/onboarding");
}

export async function signOutAction() {
  await endSession();
  redirect("/sign-in");
}

/** Saves topics and delivery times. On first run it also sends the test email. */
export async function savePreferencesAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const raw = preferencesFromForm(form);
  const parsed = preferencesSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  const p = parsed.data;
  const firstRun = !user.onboardedAt;

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        timezone: p.timezone,
        morningEnabled: p.morningEnabled,
        morningTime: p.morningTime,
        eveningEnabled: p.eveningEnabled,
        eveningTime: p.eveningTime,
        onboardedAt: user.onboardedAt ?? now(),
      })
      .where(eq(users.id, user.id));
    await tx.delete(interests).where(eq(interests.userId, user.id));
    await tx.insert(interests).values(p.topics.map((topic) => ({ userId: user.id, topic })));
  });

  if (firstRun) {
    await ingestAll(now()).catch(() => undefined);
    const [fresh] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const digest = await sendDigest(fresh, "test", now());
    redirect(digest ? `/inbox/${digest.id}?welcome=1` : "/inbox");
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Preferences saved", values: raw };
}

export async function sendTestEmailAction(): Promise<void> {
  const user = await requireUser();
  await ingestAll(now()).catch(() => undefined);
  const digest = await sendDigest(user, "test", now());
  redirect(digest ? `/inbox/${digest.id}?test=1` : "/inbox");
}

export async function setPausedAction(form: FormData): Promise<void> {
  const user = await requireUser();
  await db.update(users).set({ paused: form.get("paused") === "1" }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
}
