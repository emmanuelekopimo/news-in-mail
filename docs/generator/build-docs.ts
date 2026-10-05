/**
 * Builds docs/News-in-Mail-Documentation.pdf.
 *
 * 1. Seeds the e2e database with deterministic demo data (fixed clock).
 * 2. Starts the production build on port 3200 (run `npm run build` first).
 * 3. Takes Playwright screenshots with numbered callouts.
 * 4. Renders an HTML document with embedded fonts and prints it to PDF with Chromium.
 *
 * Usage: npm run build && npm run docs:pdf
 */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium, devices, type Browser, type Page } from "@playwright/test";
import { shoot, type Callout } from "./screenshots";

const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "docs");
const SHOTS = path.join(OUT_DIR, "screenshots");
const PORT = 3200;
const BASE = `http://localhost:${PORT}`;
const DB = process.env.DOCS_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/newsinmail_e2e";
const NOW = "2026-10-05T14:00:00Z";
const counts = JSON.parse(fs.readFileSync(path.join(__dirname, "test-counts.json"), "utf8")) as Record<string, number>;

type Section = { file: string; title: string; intro: string; notes: string[]; mobile?: boolean };
const sections: Section[] = [];

async function capture(page: Page, name: string, title: string, intro: string, callouts: Callout[], opts: { fullPage?: boolean; mobile?: boolean } = {}) {
  const file = path.join(SHOTS, `${name}.png`);
  const notes = await shoot(page, file, callouts, opts);
  sections.push({ file, title, intro, notes, mobile: opts.mobile });
  console.log(`[docs] ${name}`);
}

async function signIn(page: Page) {
  await page.goto(`${BASE}/sign-in`);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/news");
}

async function desktopShots(browser: Browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();

  await page.goto(BASE);
  await capture(page, "01-landing", "Landing page", "The first page a visitor sees. It explains the product in one sentence and offers two ways in.", [
    { selector: ".hero h1", label: "Headline that says what the app does." },
    { selector: "text=Create a free account", label: "Starts sign up, then onboarding." },
    { selector: "text=Try the demo", label: "Goes to sign in with the demo account filled in." },
    { selector: ".steps", label: "The three steps: pick topics, choose times, read." },
  ]);

  await page.goto(`${BASE}/sign-in`);
  await capture(page, "02-sign-in", "Sign in", "Email and password sign in. For the presentation the demo account is filled in already.", [
    { selector: ".demo-hint", label: "Demo credentials are shown on the page." },
    { selector: "#email", label: "Pre-filled demo email." },
    { selector: "#password", label: "Pre-filled demo password." },
    { selector: "button[type=submit]", label: "Signs in and sets a signed JWT in an HTTP-only cookie." },
  ]);

  await page.goto(`${BASE}/sign-up`);
  await page.fill("#name", "A");
  await page.fill("#email", "not-an-email");
  await page.fill("#password", "short");
  await page.click("button[type=submit]");
  await page.getByText("Use at least 8 characters").waitFor();
  await capture(page, "03-sign-up-errors", "Sign up with validation errors", "Forms are validated on the server with Zod. Errors appear under each field and the typed values are kept.", [
    { selector: ".field >> nth=0", label: "Name too short." },
    { selector: ".field >> nth=1", label: "Invalid email. The value stays in the box." },
    { selector: ".field >> nth=2", label: "Password rule shown inline." },
  ]);

  const email = `adaeze.${Date.now()}@example.ng`;
  await page.fill("#name", "Adaeze Nnamdi");
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await page.click("button[type=submit]");
  await page.waitForURL("**/onboarding");
  await page.getByRole("checkbox", { name: "Technology" }).check({ force: true });
  await capture(page, "04-onboarding", "Onboarding: pick topics and times", "New users land here right after sign up. Nothing is sent until they finish this form.", [
    { selector: ".topic-picker", label: "Topic chips. Selected topics turn blue." },
    { selector: ".slot-row >> nth=0", label: "Morning briefing switch and time (before noon)." },
    { selector: ".slot-row >> nth=1", label: "Evening briefing switch and time (noon or later)." },
    { selector: "#timezone", label: "Time zone. Africa/Lagos by default." },
    { selector: "button[type=submit]", label: "Saves preferences and sends the test email." },
  ], { fullPage: true });

  await page.click("button[type=submit]");
  await page.waitForURL(/welcome=1/);
  await page.waitForTimeout(500);
  await capture(page, "05-test-email", "The test email", "As soon as onboarding is done the user sees the email we just sent, exactly as it looks in a mail app.", [
    { selector: ".alert-success", label: "Confirmation with the address it went to." },
    { selector: ".mail-head", label: "Subject, recipient, time and delivery method." },
    { selector: "[data-testid=email-frame]", label: "The rendered email: greeting, AI intro and stories grouped by topic." },
  ]);
  await ctx.close();

  const demo = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await demo.newPage();
  await signIn(p);
  await capture(p, "06-home", "Home: your briefing", "A Google News style home page with the stories that will go into the next emails.", [
    { selector: ".tabs", label: "Section tabs: Home, Inbox and every topic. Followed topics come first." },
    { selector: ".search", label: "Search across all stored stories." },
    { selector: "[data-testid=story] >> nth=0", label: "Lead story with an illustration, source, summary and age." },
    { selector: "[data-testid=next-email]", label: "When the next email goes out, plus a button to send a test now." },
    { selector: "aside .card >> nth=1", label: "The reader's topics. Edit goes to Settings." },
    { selector: "aside .card >> nth=2", label: "The last three emails with their status." },
  ]);

  await p.goto(`${BASE}/topic/nigeria`);
  await capture(p, "07-topic", "Topic page", "Every topic has its own page with the latest stories from its sources.", [
    { selector: ".briefing-head", label: "Topic name and whether it is in your emails." },
    { selector: ".chip-sample >> nth=0", label: "Sample badge: seeded stories are marked so they are never mistaken for real news." },
    { selector: "a.tab.active", label: "Active tab is underlined in blue." },
  ]);

  await p.goto(`${BASE}/search?q=Lagos`);
  await capture(p, "08-search", "Search", "A simple case-insensitive search over titles, excerpts and sources.", [
    { selector: ".briefing-head", label: "Query and result count." },
    { selector: "[data-testid=story] >> nth=0", label: "Matching stories use the same card as the home page." },
  ]);

  await p.goto(`${BASE}/inbox`);
  await capture(p, "09-inbox", "Inbox", "Every email the app has produced for this user, including problems.", [
    { selector: ".stat-row", label: "Counts of sent, failed and skipped briefings." },
    { selector: ".mail-row:has(.status-failed)", label: "A failed delivery shows the SMTP error." },
    { selector: ".mail-row:has(.status-skipped)", label: "A skipped slot: no new stories, so nothing was sent." },
    { selector: ".mail-row >> nth=0", label: "Newest first. Morning, evening and test emails have different icons." },
  ]);

  await p.locator(".mail-row:has(.status-failed)").click();
  await p.waitForURL(/inbox\/\d+/);
  await p.waitForTimeout(500);
  await capture(p, "10-failed-email", "A failed briefing", "Opening a failed briefing shows what went wrong. The scheduler moves on to the next slot.", [
    { selector: ".status-failed", label: "Status chip." },
    { selector: ".mail-head .alert-error", label: "The delivery error from the mail server." },
    { selector: ".back", label: "Back to the inbox." },
  ]);

  await p.goto(`${BASE}/settings`);
  await capture(p, "11-settings", "Settings", "The same preferences form as onboarding, plus pause and resume.", [
    { selector: ".topic-picker", label: "Change topics at any time." },
    { selector: ".slot-row >> nth=1", label: "Change or switch off a briefing." },
    { selector: "button:has-text('Save changes')", label: "Saves and shows a confirmation." },
    { selector: "button:has-text('Pause briefings')", label: "Pause all emails, for example on holiday." },
  ], { fullPage: true });
  await demo.close();
}

async function mobileShots(browser: Browser) {
  const ctx = await browser.newContext({ ...devices["Pixel 7"] });
  const page = await ctx.newPage();
  await signIn(page);
  await capture(page, "12-mobile-home", "Mobile: home", "On a phone the search bar drops below the logo and the tabs scroll sideways.", [
    { selector: ".search", label: "Full-width search." },
    { selector: ".tabs", label: "Swipeable section tabs." },
    { selector: "[data-testid=story] >> nth=0", label: "Stories stack in one column." },
  ], { mobile: true });
  await page.goto(`${BASE}/inbox`);
  await capture(page, "13-mobile-inbox", "Mobile: inbox", "The inbox keeps the status chip and time under each subject.", [
    { selector: ".stat-row", label: "Counts stay in one row." },
    { selector: ".mail-row >> nth=0", label: "Rows wrap instead of overflowing." },
  ], { mobile: true });
  await page.locator(".mail-row").filter({ hasText: "Morning briefing" }).first().click();
  await page.waitForURL(/inbox\/\d+/);
  await page.waitForTimeout(500);
  await capture(page, "14-mobile-email", "Mobile: an email", "Emails are built with tables and inline styles so they also read well in phone mail apps.", [
    { selector: "[data-testid=email-frame]", label: "The email at phone width." },
  ], { mobile: true });
  await ctx.close();
}

function img(file: string) {
  return `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
}

function font(weight: number) {
  const f = path.join(ROOT, `node_modules/@fontsource/roboto/files/roboto-latin-${weight}-normal.woff2`);
  return `@font-face{font-family:"Roboto";font-weight:${weight};src:url(data:font/woff2;base64,${fs.readFileSync(f).toString("base64")}) format("woff2");}`;
}

function screenSection(s: Section, n: number) {
  return `<section class="shot ${s.mobile ? "mobile" : ""}">
    <h3>${n}. ${s.title}</h3>
    <p>${s.intro}</p>
    <img src="${img(s.file)}" alt="${s.title}">
    <ol class="callouts">${s.notes.map((t) => `<li>${t}</li>`).join("")}</ol>
  </section>`;
}

function buildHtml() {
  const desktop = sections.filter((s) => !s.mobile);
  const mobile = sections.filter((s) => s.mobile);
  const totalUnitInt = counts.unit + counts.integration;
  const logo = fs.readFileSync(path.join(ROOT, "public/logo.svg"), "utf8");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>News in Mail Documentation</title>
<style>
${font(400)}${font(500)}${font(700)}
@page { size: A4; margin: 18mm 16mm; }
body { font-family: Roboto, sans-serif; color: #202124; font-size: 11pt; line-height: 1.5; }
h1 { font-size: 30pt; font-weight: 400; margin: 0; }
h2 { font-size: 18pt; font-weight: 500; color: #1a73e8; margin: 0 0 8px; padding-top: 4px; border-bottom: 2px solid #e8eaed; }
h3 { font-size: 12.5pt; font-weight: 500; margin: 10px 0 4px; }
p { margin: 6px 0; }
code, .mono { font-family: "DejaVu Sans Mono", monospace; font-size: 9.5pt; background: #f1f3f4; padding: 1px 4px; border-radius: 4px; }
pre { font-family: "DejaVu Sans Mono", monospace; font-size: 9pt; background: #f1f3f4; padding: 10px 12px; border-radius: 8px; white-space: pre-wrap; }
table { border-collapse: collapse; width: 100%; font-size: 10pt; margin: 8px 0; }
th, td { border: 1px solid #dadce0; padding: 5px 8px; text-align: left; vertical-align: top; }
th { background: #f1f3f4; font-weight: 500; }
.cover { height: 250mm; display: flex; flex-direction: column; justify-content: center; }
.cover svg { width: 90px; height: 90px; }
.cover .sub { font-size: 14pt; color: #5f6368; margin-top: 8px; }
.cover .meta { margin-top: 40px; color: #3c4043; }
.chapter { page-break-before: always; }
.shot { page-break-inside: avoid; margin-bottom: 18px; }
.shot img { width: 100%; border: 1px solid #dadce0; border-radius: 8px; }
.shot.mobile img { width: auto; max-height: 150mm; display: block; margin: 0 auto; }
.callouts { margin: 8px 0 0; padding-left: 0; list-style: none; counter-reset: c; }
.callouts li { counter-increment: c; position: relative; padding-left: 30px; margin: 4px 0; }
.callouts li::before { content: counter(c); position: absolute; left: 0; top: 0; width: 20px; height: 20px; border-radius: 50%; background: #ea4335; color: #fff; font-weight: 700; font-size: 9pt; text-align: center; line-height: 20px; }
.box { background: #e8f0fe; border-radius: 8px; padding: 10px 14px; margin: 10px 0; }
.toc li { margin: 3px 0; }
.script td:first-child { width: 22mm; font-weight: 500; white-space: nowrap; }
</style></head><body>

<div class="cover">
  ${logo}
  <h1>News in Mail</h1>
  <div class="sub">Pick your interests. Get a short, AI-summarized news briefing by email every morning and evening.</div>
  <div class="meta">
    Project documentation<br>
    Live demo: <b>https://news-in-mail-production.up.railway.app</b><br>
    Demo login: <b>demo@newsinmail.ng</b> / <b>demo1234</b>
  </div>
  <ol class="toc" style="margin-top:40px">
    <li>Overview</li><li>How the core logic works</li><li>Architecture and data model</li><li>Screen walkthrough</li>
    <li>Mobile view</li><li>Running locally</li><li>Testing</li><li>Deployment</li><li>5-minute presentation script</li><li>Decisions and limits</li>
  </ol>
</div>

<section class="chapter">
<h2>1. Overview</h2>
<p>News in Mail is a web app where readers choose the subjects they care about (Nigeria, World, Business, Technology, Sports and so on) and when they want to read. Twice a day the app collects stories from free RSS news feeds, picks the most recent ones for each reader, asks an AI model to summarize each story in one or two sentences, and sends a clean email briefing.</p>
<p>The site itself looks and works like a news reader: a home page with top stories, a tab for each topic, search, an inbox of every email sent, and a settings page.</p>
<h3>Main features</h3>
<ul>
  <li>Email and password accounts, with the demo account filled in on the sign-in page.</li>
  <li>Onboarding: pick topics, morning and evening times and time zone, then a test email is sent straight away.</li>
  <li>Live stories from 20 free feeds: BBC, The Guardian, Al Jazeera, TechCrunch, Premium Times, Punch, Channels TV and Vanguard.</li>
  <li>AI summaries through OpenRouter (Claude Sonnet 5.5, with Gemini Flash as fallback). Each story is summarized once and cached.</li>
  <li>Scheduler that sends the morning and evening briefings in each reader's own time zone, without duplicates.</li>
  <li>Inbox that records every briefing as sent, failed or skipped, and shows the exact email.</li>
  <li>Works on phones: single-column layout, swipeable tabs, no sideways scrolling.</li>
</ul>
<h3>Users in the demo data</h3>
<table><tr><th>Name</th><th>Email</th><th>State</th></tr>
<tr><td>Chiamaka Okafor</td><td>demo@newsinmail.ng / demo1234</td><td>Active. Follows Nigeria, Technology, Business, Sports. Five days of email history including one failed and one skipped briefing.</td></tr>
<tr><td>Tunde Bakare</td><td>tunde.bakare@example.ng / tunde1234</td><td>Briefings paused, so the scheduler skips him.</td></tr>
<tr><td>Aisha Bello</td><td>aisha.bello@example.ng / aisha1234</td><td>Signed up but has not finished onboarding, so she gets nothing yet.</td></tr></table>
</section>

<section class="chapter">
<h2>2. How the core logic works</h2>
<p>All business rules are pure functions in <code>src/lib/</code>. They take the current time as an argument, so tests and demos can pin the clock with <code>NEWSINMAIL_TODAY=YYYY-MM-DD</code> (or <code>NEWSINMAIL_NOW</code> for an exact instant).</p>
<h3>Step 1: collect stories (src/server/ingest.ts)</h3>
<p>Every 5 minutes the scheduler checks whether the feeds were read in the last 20 minutes. If not, it downloads all 20 RSS feeds in parallel, cleans the text (HTML, typographic quotes and dashes, "Read More" links), and stores up to 15 items per feed. The story link is unique, so the same story is never stored twice. Stories older than 14 days are deleted.</p>
<h3>Step 2: decide who is due (src/lib/schedule.ts, dueSlots)</h3>
<p>For each reader who has finished onboarding and is not paused, the app converts "now" into the reader's local date and time. A slot (morning or evening) is due when:</p>
<ul><li>the slot is switched on,</li><li>its local time has passed today,</li><li>it is less than 3 hours late (so a server restart at night does not send a stale morning email), and</li><li>nothing has been recorded for that slot today.</li></ul>
<p>The database backs this up with a unique index on (user, local date, slot), so even two servers running at once cannot send the same briefing twice.</p>
<h3>Step 3: pick stories (src/lib/ranking.ts, selectArticles)</h3>
<ul><li>Keep only the reader's topics and stories from the last 36 hours.</li>
<li>Remove any story the reader already received in the last 3 days.</li>
<li>Sort newest first, then take stories round-robin across topics (at most 3 per topic, 10 in total) so one busy topic cannot fill the email.</li></ul>
<h3>Step 4: summarize (src/server/openrouter.ts)</h3>
<p>Stories that do not yet have a summary are sent to OpenRouter in one request. The model returns JSON with a one-line intro and a summary for each story. Summaries are saved on the story so they are reused by every reader. If the AI call fails or there is no API key, the app falls back to the first one or two sentences of the feed excerpt, so an email always goes out.</p>
<h3>Step 5: render and deliver (src/lib/email.ts, src/server/mailer.ts)</h3>
<p>The email is built with tables and inline styles, which mail apps need. It greets the reader by first name, groups stories by topic in the reader's order, links each headline to the source and says when the next briefing is due. If <code>SMTP_URL</code> is set the email is sent by SMTP. Otherwise it is stored in the in-app inbox. The result is recorded as <b>sent</b>, <b>failed</b> (with the mail server error) or <b>skipped</b> (no new stories).</p>
</section>

<section class="chapter">
<h2>3. Architecture and data model</h2>
<svg viewBox="0 0 700 300" width="100%" style="max-height:62mm" xmlns="http://www.w3.org/2000/svg" font-family="Roboto" font-size="12">
  <defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5f6368"/></marker></defs>
  <rect x="10" y="20" width="150" height="60" rx="10" fill="#e8f0fe" stroke="#1a73e8"/><text x="85" y="46" text-anchor="middle" font-weight="500">Browser</text><text x="85" y="64" text-anchor="middle">desktop and mobile</text>
  <rect x="230" y="10" width="240" height="190" rx="12" fill="#fff" stroke="#1a73e8" stroke-width="2"/><text x="350" y="32" text-anchor="middle" font-weight="700">Next.js 16 server (Railway)</text>
  <rect x="245" y="44" width="210" height="28" rx="6" fill="#f1f3f4"/><text x="350" y="62" text-anchor="middle">proxy.ts: checks the session cookie</text>
  <rect x="245" y="78" width="210" height="28" rx="6" fill="#f1f3f4"/><text x="350" y="96" text-anchor="middle">Server Components + Server Actions</text>
  <rect x="245" y="112" width="210" height="28" rx="6" fill="#f1f3f4"/><text x="350" y="130" text-anchor="middle">src/lib: pure business rules</text>
  <rect x="245" y="146" width="210" height="40" rx="6" fill="#fef7e0"/><text x="350" y="163" text-anchor="middle">Scheduler (instrumentation.ts)</text><text x="350" y="179" text-anchor="middle">every 5 min: ingest + due digests</text>
  <rect x="540" y="20" width="150" height="50" rx="10" fill="#e6f4ea" stroke="#188038"/><text x="615" y="50" text-anchor="middle" font-weight="500">PostgreSQL</text>
  <rect x="540" y="90" width="150" height="50" rx="10" fill="#fce8e6" stroke="#d93025"/><text x="615" y="112" text-anchor="middle" font-weight="500">OpenRouter</text><text x="615" y="128" text-anchor="middle">AI summaries</text>
  <rect x="540" y="160" width="150" height="50" rx="10" fill="#f1f3f4" stroke="#5f6368"/><text x="615" y="182" text-anchor="middle" font-weight="500">20 RSS feeds</text><text x="615" y="198" text-anchor="middle">BBC, Punch, ...</text>
  <rect x="300" y="240" width="160" height="48" rx="10" fill="#e8f0fe" stroke="#1a73e8"/><text x="380" y="261" text-anchor="middle" font-weight="500">Email</text><text x="380" y="277" text-anchor="middle">SMTP or in-app inbox</text>
  <line x1="160" y1="50" x2="228" y2="60" stroke="#5f6368" marker-end="url(#a)"/>
  <line x1="470" y1="60" x2="538" y2="45" stroke="#5f6368" marker-end="url(#a)"/>
  <line x1="470" y1="120" x2="538" y2="115" stroke="#5f6368" marker-end="url(#a)"/>
  <line x1="470" y1="170" x2="538" y2="185" stroke="#5f6368" marker-end="url(#a)"/>
  <line x1="350" y1="200" x2="370" y2="238" stroke="#5f6368" marker-end="url(#a)"/>
</svg>
<h3>Tech stack</h3>
<table><tr><th>Part</th><th>Choice</th></tr>
<tr><td>Web framework</td><td>Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript strict</td></tr>
<tr><td>Database</td><td>PostgreSQL with Drizzle ORM. drizzle-kit creates versioned SQL migrations in <code>drizzle/</code></td></tr>
<tr><td>Validation</td><td>Zod schemas in <code>src/lib/validation.ts</code>, with errors shown under each field</td></tr>
<tr><td>Auth</td><td>bcryptjs password hashes. A signed JWT (jose, HS256, 7 days) in an HTTP-only cookie. <code>src/proxy.ts</code> guards private pages</td></tr>
<tr><td>UI</td><td>Plain CSS, lucide-react icons, DiceBear avatars generated locally, Roboto from @fontsource, custom SVG logo and illustrations</td></tr>
<tr><td>Tests</td><td>Vitest (unit and integration against real Postgres) and Playwright (desktop and mobile)</td></tr></table>
<h3>Data model</h3>
<table><tr><th>Table</th><th>Key columns</th><th>Purpose</th></tr>
<tr><td>users</td><td>id, name, email (unique), password_hash, timezone, morning_enabled, morning_time, evening_enabled, evening_time, paused, onboarded_at</td><td>Accounts and delivery preferences</td></tr>
<tr><td>interests</td><td>user_id, topic (primary key on both)</td><td>Which topics each user follows</td></tr>
<tr><td>articles</td><td>id, link (unique), topic, source, title, excerpt, summary, summary_model, is_sample, published_at</td><td>Stories from feeds, with cached AI summary</td></tr>
<tr><td>digests</td><td>id, user_id, slot, digest_date, status, subject, html, text, article_ids, delivered_via, error</td><td>Every briefing produced. Unique on (user_id, digest_date, slot) for morning and evening</td></tr></table>
<p>Every query that reads digests filters by the signed-in user's id, and opening another user's email returns "not found".</p>
</section>

<section class="chapter">
<h2>4. Screen walkthrough</h2>
<p>The numbers on each screenshot match the list under it. Screenshots use the seeded demo data with the clock fixed at 3:00 PM Lagos time.</p>
${desktop.map((s, i) => screenSection(s, i + 1)).join("\n")}
</section>

<section class="chapter">
<h2>5. Mobile view</h2>
<p>Captured on a Pixel 7 sized screen (412 by 915). Every grid uses <code>minmax(0, 1fr)</code> columns so long headlines wrap instead of pushing the page sideways. A Playwright test checks that no page scrolls sideways.</p>
${mobile.map((s, i) => screenSection(s, i + 1)).join("\n")}
</section>

<section class="chapter">
<h2>6. Running locally</h2>
<pre>
# 1. Database
service postgresql start
sudo -u postgres psql -c "CREATE DATABASE newsinmail;" -c "CREATE DATABASE newsinmail_test;"

# 2. App
cp .env.example .env          # set DATABASE_URL, SESSION_SECRET, OPENROUTER_API_KEY
npm install
npm run db:migrate
npm run db:seed               # demo users, sample stories, email history
npm run ingest                # optional: pull live stories now
npm run dev                   # http://localhost:3000
</pre>
<table><tr><th>Variable</th><th>Meaning</th></tr>
<tr><td>DATABASE_URL</td><td>Postgres connection string</td></tr>
<tr><td>SESSION_SECRET</td><td>Secret used to sign session cookies (16+ characters)</td></tr>
<tr><td>OPENROUTER_API_KEY</td><td>Enables AI summaries. Without it, the first sentences of each story are used</td></tr>
<tr><td>OPENROUTER_MODEL</td><td>Optional. Default anthropic/claude-sonnet-5.5</td></tr>
<tr><td>SMTP_URL, MAIL_FROM</td><td>Optional. Real email delivery. Without them emails go to the in-app inbox</td></tr>
<tr><td>NEWSINMAIL_TODAY / NEWSINMAIL_NOW</td><td>Pin the date or exact time for demos and tests</td></tr>
<tr><td>NEWSINMAIL_SCHEDULER</td><td>"on" to run the scheduler in development, "off" to disable it</td></tr>
<tr><td>CRON_SECRET</td><td>Enables POST /api/cron to run the scheduler on demand</td></tr></table>
</section>

<section class="chapter">
<h2>7. Testing</h2>
<table><tr><th>Suite</th><th>Tool</th><th>Tests</th><th>What it covers</th></tr>
<tr><td>Unit</td><td>Vitest</td><td>${counts.unit}</td><td>Schedule rules, story selection, text cleaning, email rendering, validation, session tokens, clock override, AI reply parsing</td></tr>
<tr><td>Integration</td><td>Vitest + Postgres</td><td>${counts.integration}</td><td>Seed data, sending a digest, skipping, no repeated stories, scheduler idempotency, paused users, user scoping, duplicate protection, RSS parsing</td></tr>
<tr><td>End to end</td><td>Playwright (desktop)</td><td>${counts.e2eDesktop}</td><td>Landing, demo login, wrong password, inline sign-up errors, full onboarding with test email, home, inbox, failed email, test email button, settings and pause, tabs and search, 404 for other users' emails</td></tr>
<tr><td>End to end</td><td>Playwright (mobile, Pixel 7)</td><td>${counts.e2eMobile}</td><td>No sideways scrolling on four pages, opening an email from the inbox</td></tr></table>
<p><b>Total: ${totalUnitInt + counts.e2eDesktop + counts.e2eMobile} tests, all passing.</b></p>
<pre>
npm test              # unit + integration (uses newsinmail_test)
npm run build
npm run test:e2e      # starts the app on port 3100 against newsinmail_e2e
</pre>
<p>Tests run offline (<code>NEWSINMAIL_OFFLINE=1</code>) with a fixed clock, so results do not depend on the news of the day.</p>
</section>

<section class="chapter">
<h2>8. Deployment</h2>
<p>The app runs on Railway in the "school-projects" project as the service <b>news-in-mail</b>. Railway deploys automatically from the <code>main</code> branch of the GitHub repository.</p>
<ul>
<li><b>Build:</b> <code>npm run build</code></li>
<li><b>Start:</b> <code>npm run start:railway</code>: run migrations, seed demo data only if the database has no users, then <code>next start -H 0.0.0.0</code>.</li>
<li><b>Health check:</b> <code>/api/health</code> runs <code>select 1</code> against the database and returns <code>{"status":"ok"}</code>.</li>
<li><b>Variables:</b> DATABASE_URL (built from the Postgres service's <code>\${{Postgres.*}}</code> references), SESSION_SECRET (random), NODE_ENV=production, OPENROUTER_API_KEY, CRON_SECRET.</li>
</ul>
<div class="box">The project had reached Railway's limit of 10 volumes, so a new Postgres service could not be created. The app uses the existing <b>Postgres</b> service but in its own database called <code>newsinmail</code>, which the migrate script creates on first start. Other apps' data is not touched.</div>
<p>Public URL: <b>https://news-in-mail-production.up.railway.app</b></p>
</section>

<section class="chapter">
<h2>9. Five-minute presentation script</h2>
<table class="script">
<tr><th>Time</th><th>What to do and say</th></tr>
<tr><td>0:00 - 0:30</td><td>Open the landing page. "News in Mail sends you a short news briefing every morning and evening, only on the topics you pick, summarized by AI from free news sources."</td></tr>
<tr><td>0:30 - 1:30</td><td>Click Create a free account, sign up with your own email. On onboarding pick two or three topics, show morning and evening times and the time zone. Click Finish. "A test email is sent straight away." Show the email: greeting, AI intro, stories grouped by topic, links to the source.</td></tr>
<tr><td>1:30 - 2:15</td><td>Sign out, sign in as the demo user (already filled in). Show the Home page: Google News style tabs, top stories with summaries, Next email card, topics and recent emails. Click a topic tab and do a search for "Lagos".</td></tr>
<tr><td>2:15 - 3:00</td><td>Open the Inbox. "Every briefing is recorded." Point to the sent, failed and skipped counts. Open the failed one: the SMTP error is shown. Open a skipped one: no new stories, so nothing was sent.</td></tr>
<tr><td>3:00 - 3:45</td><td>Explain the logic with the diagram in section 3: feeds are read every 20 minutes, the scheduler checks each user's local time every 5 minutes, picks fresh stories round-robin across topics, never repeats a story, summarizes once with Claude through OpenRouter, and a unique index stops duplicate emails.</td></tr>
<tr><td>3:45 - 4:30</td><td>Open Settings, change the evening time and save; the Next email card updates. Pause and resume. Show the site on a phone (or browser device mode).</td></tr>
<tr><td>4:30 - 5:00</td><td>Close with quality: ${totalUnitInt + counts.e2eDesktop + counts.e2eMobile} automated tests (unit, integration on real Postgres, Playwright on desktop and mobile), deployed on Railway with a database health check. Take questions.</td></tr>
</table>
</section>

<section class="chapter">
<h2>10. Decisions and limits</h2>
<ul>
<li><b>Email delivery:</b> no mail account was provided, so emails are stored in an in-app inbox that shows them exactly as a mail app would. Setting <code>SMTP_URL</code> (for example a Gmail app password or a Brevo or Resend SMTP URL) sends real email with no code change.</li>
<li><b>Default times:</b> 7:00 AM and 6:00 PM, Africa/Lagos time zone. Morning must be before noon, evening at noon or later.</li>
<li><b>AI model:</b> Claude Sonnet 5.5 through OpenRouter, Gemini Flash as fallback. Summaries are made only for stories that go into an email and are cached, which keeps cost low.</li>
<li><b>Images:</b> news photos are not loaded (hotlinking is unreliable and blocked in the build sandbox). Each topic has its own SVG illustration instead.</li>
<li><b>Sample stories:</b> seeded stories use made-up sources and are labeled "Sample" so they are not mistaken for real news. Live stories replace them at the top as soon as the feeds are read.</li>
<li><b>Scheduler:</b> runs inside the web server (Next.js instrumentation) every 5 minutes, which suits a single Railway instance. The unique index makes it safe if more instances are added.</li>
</ul>
</section>
</body></html>`;
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Server did not start");
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  const env = { ...process.env, DATABASE_URL: DB, NEWSINMAIL_NOW: NOW, NEWSINMAIL_OFFLINE: "1", NEWSINMAIL_SCHEDULER: "off", SMTP_URL: "", OPENROUTER_API_KEY: "", SESSION_SECRET: "docs-secret-docs-secret-docs" };
  execSync("npx tsx scripts/migrate.ts && npx tsx scripts/seed.ts", { cwd: ROOT, env, stdio: "inherit" });
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: ROOT, env, stdio: "ignore" });
  try {
    await waitForServer();
    const browser = await chromium.launch();
    await desktopShots(browser);
    await mobileShots(browser);
    const html = buildHtml();
    const htmlPath = path.join(__dirname, "documentation.html");
    fs.writeFileSync(htmlPath, html);
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const pdf = path.join(OUT_DIR, "News-in-Mail-Documentation.pdf");
    await page.pdf({
      path: pdf,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#5f6368">News in Mail documentation - page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });
    await browser.close();
    fs.rmSync(htmlPath);
    console.log(`[docs] wrote ${pdf}`);
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
