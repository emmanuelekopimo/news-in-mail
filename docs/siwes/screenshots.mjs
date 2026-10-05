// Takes clean screenshots of News in Mail for the SIWES report.
// Usage (from the repo root, after `npm run build`): node docs/siwes/screenshots.mjs
import { chromium, devices } from "@playwright/test";
import { execSync, spawn } from "node:child_process";

const OUT = "docs/siwes/img";
const env = {
  ...process.env,
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/newsinmail_e2e",
  NEWSINMAIL_NOW: "2026-10-05T14:00:00Z",
  NEWSINMAIL_OFFLINE: "1",
  NEWSINMAIL_SCHEDULER: "off",
  SMTP_URL: "",
  OPENROUTER_API_KEY: "",
  SESSION_SECRET: "docs-secret-docs-secret-docs",
};
execSync("npx tsx scripts/migrate.ts && npx tsx scripts/seed.ts", { env, stdio: "inherit" });
const srv = spawn("npx", ["next", "start", "-p", "3201"], { env, stdio: "ignore" });
const B = "http://localhost:3201";

try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(B + "/api/health")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` });

  await p.goto(B);
  await shot("landing");
  await p.goto(B + "/sign-in");
  await shot("signin");

  await p.goto(B + "/sign-up");
  await p.fill("#name", "Godswill Essien");
  await p.fill("#email", `godswill.${Date.now()}@example.ng`);
  await p.fill("#password", "password123");
  await p.click("button[type=submit]");
  await p.waitForURL("**/onboarding");
  for (const t of ["Technology", "Business"]) await p.getByRole("checkbox", { name: t }).check({ force: true });
  await p.setViewportSize({ width: 1280, height: 1100 });
  await shot("onboarding");
  await p.click("button[type=submit]");
  await p.waitForURL(/welcome=1/);
  await p.waitForTimeout(600);
  await p.setViewportSize({ width: 1280, height: 1000 });
  await shot("testemail");

  await ctx.clearCookies();
  await p.goto(B + "/sign-in");
  await p.click("button[type=submit]");
  await p.waitForURL("**/news");
  await p.setViewportSize({ width: 1280, height: 900 });
  await shot("home");
  await p.goto(B + "/inbox");
  await shot("inbox");
  await p.locator(".mail-row:has(.status-failed)").click();
  await p.waitForURL(/inbox\/\d+/);
  await p.waitForTimeout(500);
  await shot("failed");
  await p.setViewportSize({ width: 1280, height: 1000 });
  await p.goto(B + "/settings");
  await shot("settings");

  const m = await b.newContext({ ...devices["Pixel 7"] });
  const q = await m.newPage();
  await q.goto(B + "/sign-in");
  await q.click("button[type=submit]");
  await q.waitForURL("**/news");
  await q.screenshot({ path: `${OUT}/m-home.png` });
  await q.goto(B + "/inbox");
  await q.locator(".mail-row").filter({ hasText: "Morning briefing" }).first().click();
  await q.waitForURL(/inbox\/\d+/);
  await q.waitForTimeout(500);
  await q.screenshot({ path: `${OUT}/m-email.png` });
  await b.close();
  console.log("screenshots done");
} finally {
  srv.kill();
}
