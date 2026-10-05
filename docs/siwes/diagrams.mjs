// Draws the report diagrams as SVG and renders them to PNG with Chromium.
// Usage: node docs/siwes/diagrams.mjs
import { chromium } from "@playwright/test";

const OUT = "docs/siwes/img";
const BLUE = "#1a4f8b";
const LIGHT = "#e8f0fb";
const GREEN = "#e6f4ea";
const YELLOW = "#fff4d6";
const RED = "#fde7e4";
const GREY = "#f2f2f2";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
}
function box(x, y, w, h, lines, fill = LIGHT, opts = {}) {
  const ls = Array.isArray(lines) ? lines : [lines];
  const lh = opts.lh ?? 17;
  const start = y + h / 2 - ((ls.length - 1) * lh) / 2 + 5;
  const rx = opts.rx ?? 8;
  const stroke = opts.stroke ?? BLUE;
  const text = ls
    .map((l, i) => `<text x="${x + w / 2}" y="${start + i * lh}" text-anchor="middle" font-size="${opts.fs ?? 14}" ${i === 0 && opts.bold !== false ? 'font-weight="bold"' : ""}>${esc(l)}</text>`)
    .join("");
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>${text}`;
}
function arrow(x1, y1, x2, y2, label = "", opts = {}) {
  const mx = (x1 + x2) / 2 + (opts.dx ?? 0);
  const my = (y1 + y2) / 2 + (opts.dy ?? -6);
  const dash = opts.dash ? 'stroke-dasharray="6 4"' : "";
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="1.5" marker-end="url(#ah)" ${dash}/>${label ? `<text x="${mx}" y="${my}" text-anchor="middle" font-size="12" fill="#333">${esc(label)}</text>` : ""}`;
}
function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Liberation Serif, Times New Roman, serif">
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#333"/></marker></defs>
<rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
}
function actor(x, y, name) {
  return `<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#333" stroke-width="1.6"/><line x1="${x}" y1="${y + 12}" x2="${x}" y2="${y + 45}" stroke="#333" stroke-width="1.6"/><line x1="${x - 20}" y1="${y + 24}" x2="${x + 20}" y2="${y + 24}" stroke="#333" stroke-width="1.6"/><line x1="${x}" y1="${y + 45}" x2="${x - 16}" y2="${y + 70}" stroke="#333" stroke-width="1.6"/><line x1="${x}" y1="${y + 45}" x2="${x + 16}" y2="${y + 70}" stroke="#333" stroke-width="1.6"/><text x="${x}" y="${y + 90}" text-anchor="middle" font-size="14" font-weight="bold">${esc(name)}</text>`;
}
function ellipse(cx, cy, rx, ry, text) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${LIGHT}" stroke="${BLUE}" stroke-width="1.5"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="13">${esc(text)}</text>`;
}
function line(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="1.3"/>`;
}

const D = {};

// 2.1 Timeline of Start Innovation Hub
D.timeline = (() => {
  const items = [
    ["2011", "Founder active in", "Uyo tech community"],
    ["May 2014", "Start Innovation Hub", "incorporated in Uyo"],
    ["Before 2020", "Google, Andela and", "Facebook partnerships"],
    ["By 2023", "World Bank, UNDP, PIND", "programmes; 13 startups"],
    ["Jan 2025", "10 years; $100m startup", "funding target announced"],
    ["Jul 2025", "N40m scholarships;", "NBTE skills centre"],
    ["2026", "TalentPort Academy,", "Kids Bootcamp, SIWES"],
  ];
  let b = `<line x1="40" y1="150" x2="1060" y2="150" stroke="${BLUE}" stroke-width="4"/>`;
  items.forEach((it, i) => {
    const x = 80 + i * 157;
    const up = i % 2 === 0;
    b += `<circle cx="${x}" cy="150" r="9" fill="${BLUE}"/>`;
    b += `<text x="${x}" y="${up ? 120 : 190}" text-anchor="middle" font-size="16" font-weight="bold" fill="${BLUE}">${it[0]}</text>`;
    b += `<text x="${x}" y="${up ? 62 : 222}" text-anchor="middle" font-size="13">${esc(it[1])}</text>`;
    b += `<text x="${x}" y="${up ? 80 : 240}" text-anchor="middle" font-size="13">${esc(it[2])}</text>`;
  });
  return svg(1100, 270, b);
})();

// 2.2 Organisational structure
D.org = (() => {
  let b = box(420, 15, 260, 50, ["Board / Founders"], GREY);
  b += box(420, 95, 260, 55, ["Chief Executive Officer", "(Hanson Johnson)"], LIGHT, { fs: 14 });
  b += arrow(550, 65, 550, 93);
  const heads = [
    [40, "Head of Training", "TalentPort Academy"],
    [300, "Program Manager", "Programmes and events"],
    [560, "Business Development", "Partners and Business Catalyst"],
    [820, "Software Development", "Client web and mobile projects"],
  ];
  b += line(170, 180, 950, 180) + line(550, 150, 550, 180);
  for (const [x, t, s] of heads) {
    b += line(x + 130, 180, x + 130, 200);
    b += box(x, 200, 260, 60, [t, s], x === 820 ? YELLOW : LIGHT, { fs: 13 });
  }
  const units = [
    [40, "Instructors and mentors"],
    [300, "Community, Women, Kids"],
    [560, "Incubated startups"],
    [820, "Developers and SIWES interns"],
  ];
  for (const [x, t] of units) {
    b += arrow(x + 130, 260, x + 130, 288);
    b += box(x, 290, 260, 44, [t], x === 820 ? YELLOW : GREY, { fs: 13, bold: false });
  }
  b += box(300, 360, 520, 40, ["Administration, finance and the co-working space support all units"], GREY, { fs: 13, bold: false });
  return svg(1120, 420, b);
})();

// 3.1 Six-month path
D.path = (() => {
  const phases = [
    ["Weeks 1 - 3", "Orientation", "Git, Linux, HTML, CSS"],
    ["Weeks 4 - 7", "JavaScript and", "TypeScript, DOM, fetch"],
    ["Weeks 8 - 11", "React and Next.js", "components, routing"],
    ["Weeks 12 - 16", "Backend", "Node.js, REST, SQL"],
    ["Weeks 17 - 20", "Team projects", "client and hub apps"],
    ["Weeks 21 - 24", "Mini project", "News in Mail"],
  ];
  let b = "";
  phases.forEach((p, i) => {
    const x = 15 + i * 180;
    b += box(x, 40, 160, 100, [p[1], p[2]], i === 5 ? YELLOW : i >= 3 ? GREEN : LIGHT, { fs: 13 });
    b += `<text x="${x + 80}" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="${BLUE}">${p[0]}</text>`;
    if (i < 5) b += arrow(x + 160, 90, x + 178, 90);
  });
  b += `<text x="550" y="175" text-anchor="middle" font-size="13">Frontend foundations (blue) - backend and team work (green) - mini project (yellow)</text>`;
  return svg(1100, 190, b);
})();

// 3.2 Client-server flow
D.http = (() => {
  let b = box(20, 110, 170, 80, ["Browser", "(client)"], LIGHT);
  b += box(270, 20, 170, 60, ["DNS"], GREY);
  b += box(270, 200, 170, 80, ["Web server", "Next.js / Express"], GREEN);
  b += box(530, 200, 170, 80, ["API logic", "validation, auth"], GREEN);
  b += box(790, 200, 170, 80, ["PostgreSQL", "database"], YELLOW);
  b += arrow(150, 110, 268, 60, "1. resolve name", { dy: -8 });
  b += arrow(190, 165, 268, 225, "2. HTTP request", { dx: -40, dy: 8 });
  b += arrow(440, 240, 528, 240, "3. route");
  b += arrow(700, 240, 788, 240, "4. SQL query");
  b += arrow(790, 262, 702, 262, "5. rows", { dy: 18 });
  b += arrow(268, 270, 150, 192, "6. JSON / HTML", { dx: 30, dy: 30 });
  return svg(990, 300, b);
})();

// 3.3 Git workflow
D.git = (() => {
  let b = `<line x1="40" y1="60" x2="960" y2="60" stroke="${BLUE}" stroke-width="4"/><text x="40" y="40" font-size="15" font-weight="bold" fill="${BLUE}">main</text>`;
  b += `<path d="M160 60 C 200 60, 200 150, 250 150 L 640 150 C 700 150, 700 60, 740 60" fill="none" stroke="#188038" stroke-width="4"/>`;
  b += `<text x="260" y="180" font-size="14" font-weight="bold" fill="#188038">feature/login-form</text>`;
  for (const x of [100, 160, 740, 880]) b += `<circle cx="${x}" cy="60" r="10" fill="${BLUE}"/>`;
  for (const x of [300, 420, 540]) b += `<circle cx="${x}" cy="150" r="10" fill="#188038"/>`;
  b += `<text x="160" y="95" text-anchor="middle" font-size="12">git switch -c</text>`;
  b += `<text x="420" y="130" text-anchor="middle" font-size="12">git commit (small steps)</text>`;
  b += box(560, 190, 220, 50, ["Pull request + review", "CI runs tests"], YELLOW, { fs: 12 });
  b += `<text x="740" y="40" text-anchor="middle" font-size="12">merge</text>`;
  b += `<text x="880" y="40" text-anchor="middle" font-size="12">deploy</text>`;
  return svg(1000, 260, b);
})();

// 3.4 Layered backend
D.layers = (() => {
  const rows = [
    ["Routes", "GET /api/events, POST /api/registrations", LIGHT],
    ["Validation and auth middleware", "Zod schemas, JWT check, rate limit", GREY],
    ["Controllers", "read the request, call a service, send a status code", LIGHT],
    ["Services", "business rules: capacity, duplicates, emails", GREEN],
    ["Data access", "SQL queries with an ORM, transactions", YELLOW],
    ["PostgreSQL", "tables, keys, indexes, migrations", YELLOW],
  ];
  let b = "";
  rows.forEach((r, i) => {
    const y = 15 + i * 72;
    b += box(150, y, 600, 56, [r[0], r[1]], r[2], { fs: 13 });
    if (i < rows.length - 1) b += arrow(450, y + 56, 450, y + 70);
  });
  b += `<text x="70" y="230" text-anchor="middle" font-size="13" transform="rotate(-90 70 230)">Each layer only talks to the one below it</text>`;
  return svg(800, 450, b);
})();

// 4.1 Increments
D.increments = (() => {
  const inc = [
    ["Increment 1", "Data model, auth,", "sign up and sign in"],
    ["Increment 2", "Feeds, topics,", "Google News style UI"],
    ["Increment 3", "Digest engine, AI", "summaries, scheduler"],
    ["Increment 4", "Inbox, tests,", "deployment, docs"],
  ];
  let b = "";
  inc.forEach((t, i) => {
    const x = 20 + i * 250;
    b += box(x, 30, 210, 100, t, [LIGHT, GREEN, YELLOW, RED][i], { fs: 14 });
    b += `<text x="${x + 105}" y="155" text-anchor="middle" font-size="12">plan - build - test - review</text>`;
    if (i < 3) b += arrow(x + 210, 80, x + 248, 80);
  });
  return svg(1000, 170, b);
})();

// 4.2 Use case
D.usecase = (() => {
  let b = actor(70, 120, "Reader");
  b += actor(890, 60, "Scheduler");
  b += actor(890, 250, "OpenRouter AI");
  b += `<rect x="190" y="15" width="610" height="420" rx="14" fill="none" stroke="${BLUE}" stroke-width="2"/><text x="495" y="40" text-anchor="middle" font-size="15" font-weight="bold">News in Mail</text>`;
  const ucs = [
    [340, 80, "Sign up / sign in"],
    [340, 140, "Pick topics and times"],
    [340, 200, "Receive test email"],
    [340, 260, "Read and search news"],
    [340, 320, "View inbox of briefings"],
    [340, 380, "Pause or resume"],
    [650, 110, "Fetch RSS feeds"],
    [650, 190, "Send due briefings"],
    [650, 280, "Summarise stories"],
  ];
  for (const [x, y, t] of ucs) b += ellipse(x, y, 120, 24, t);
  for (const [, y] of ucs.slice(0, 6)) b += line(95, 160, 220, y);
  b += line(865, 100, 770, 110) + line(865, 100, 770, 190) + line(865, 290, 770, 280);
  b += `<line x1="650" y1="214" x2="650" y2="254" stroke="#333" stroke-dasharray="5 4" marker-end="url(#ah)"/><text x="660" y="240" font-size="11">include</text>`;
  return svg(980, 450, b);
})();

// 4.3 Architecture
D.arch = (() => {
  let b = box(20, 150, 160, 80, ["Browser", "desktop / mobile"], LIGHT);
  b += `<rect x="230" y="20" width="420" height="390" rx="14" fill="#fafcff" stroke="${BLUE}" stroke-width="2"/><text x="440" y="45" text-anchor="middle" font-size="15" font-weight="bold">Next.js 16 application (Railway)</text>`;
  b += box(255, 65, 370, 45, ["proxy.ts: checks the session cookie"], GREY, { fs: 13 });
  b += box(255, 125, 370, 55, ["Server Components and Server Actions", "pages, forms, Zod validation"], LIGHT, { fs: 13 });
  b += box(255, 195, 370, 55, ["src/lib: pure business rules", "schedule, ranking, email, text"], GREEN, { fs: 13 });
  b += box(255, 265, 370, 55, ["src/server: services", "ingest, digest, mailer, OpenRouter"], GREEN, { fs: 13 });
  b += box(255, 335, 370, 55, ["Scheduler (instrumentation.ts)", "every 5 minutes"], YELLOW, { fs: 13 });
  b += box(720, 40, 200, 60, ["PostgreSQL", "Drizzle ORM"], YELLOW);
  b += box(720, 140, 200, 60, ["OpenRouter", "Claude / Gemini"], RED);
  b += box(720, 240, 200, 60, ["20 RSS feeds", "BBC, Punch, ..."], GREY);
  b += box(720, 340, 200, 60, ["Email", "SMTP or in-app inbox"], LIGHT);
  b += arrow(180, 190, 253, 150, "HTTPS");
  b += arrow(627, 150, 718, 75);
  b += arrow(627, 290, 718, 172);
  b += arrow(627, 300, 718, 268);
  b += arrow(627, 362, 718, 368);
  return svg(950, 430, b);
})();

// 4.4 Digest flowchart
D.flow = (() => {
  const steps = [
    ["Scheduler tick (every 5 min)", GREY],
    ["Read feeds if older than 20 min", LIGHT],
    ["For each onboarded, unpaused user", LIGHT],
  ];
  let b = "";
  steps.forEach((s, i) => {
    b += box(330, 15 + i * 75, 320, 50, [s[0]], s[1], { fs: 13 });
    b += arrow(490, 65 + i * 75, 490, 88 + i * 75);
  });
  b += `<polygon points="490,240 640,285 490,330 340,285" fill="${YELLOW}" stroke="${BLUE}" stroke-width="1.6"/><text x="490" y="282" text-anchor="middle" font-size="13" font-weight="bold">Slot due in local time</text><text x="490" y="299" text-anchor="middle" font-size="12">and not handled today?</text>`;
  b += arrow(640, 285, 760, 285, "no");
  b += box(762, 260, 200, 50, ["Wait for next tick"], GREY, { fs: 13 });
  b += arrow(490, 330, 490, 360, "yes", { dx: 20 });
  const s2 = [
    ["Pick stories: user's topics, last 36 h, not sent before", LIGHT],
    ["Summarise new stories with AI (cache result)", GREEN],
    ["Render HTML and text email", LIGHT],
    ["Deliver: SMTP or in-app inbox", LIGHT],
    ["Record digest: sent, failed or skipped", YELLOW],
  ];
  s2.forEach((s, i) => {
    b += box(290, 362 + i * 72, 400, 50, [s[0]], s[1], { fs: 13 });
    if (i < s2.length - 1) b += arrow(490, 412 + i * 72, 490, 432 + i * 72);
  });
  b += `<text x="80" y="600" font-size="12">No stories? the digest is</text><text x="80" y="616" font-size="12">recorded as "skipped".</text>`;
  return svg(990, 730, b);
})();

// 4.5 Sequence
D.sequence = (() => {
  const cols = [["Reader", 80], ["Browser", 250], ["Server Action", 440], ["Database", 630], ["OpenRouter", 800], ["Mailer", 950]];
  let b = "";
  for (const [n, x] of cols) {
    b += box(x - 70, 10, 140, 40, [n], LIGHT, { fs: 13 });
    b += `<line x1="${x}" y1="50" x2="${x}" y2="560" stroke="#777" stroke-dasharray="5 5"/>`;
  }
  const msgs = [
    [80, 250, "fill form, click Finish"],
    [250, 440, "savePreferences(form)"],
    [440, 630, "validate, save topics"],
    [440, 630, "load fresh stories"],
    [630, 440, "stories", true],
    [440, 800, "summarise batch"],
    [800, 440, "JSON summaries", true],
    [440, 630, "cache summaries"],
    [440, 950, "deliver email"],
    [440, 630, "insert digest (test)"],
    [440, 250, "redirect /inbox/:id", true],
    [250, 80, "show test email", true],
  ];
  msgs.forEach(([a, c, t, ret], i) => {
    const y = 85 + i * 39;
    b += `<line x1="${a}" y1="${y}" x2="${c}" y2="${y}" stroke="#333" stroke-width="1.4" ${ret ? 'stroke-dasharray="6 4"' : ""} marker-end="url(#ah)"/>`;
    b += `<text x="${(a + c) / 2}" y="${y - 5}" text-anchor="middle" font-size="12">${esc(t)}</text>`;
  });
  return svg(1030, 570, b);
})();

// 4.6 ERD
D.erd = (() => {
  function table(x, y, name, cols, fill) {
    let t = `<rect x="${x}" y="${y}" width="250" height="${34 + cols.length * 22}" fill="#fff" stroke="${BLUE}" stroke-width="1.6"/><rect x="${x}" y="${y}" width="250" height="32" fill="${fill}" stroke="${BLUE}" stroke-width="1.6"/><text x="${x + 125}" y="${y + 22}" text-anchor="middle" font-size="15" font-weight="bold">${name}</text>`;
    cols.forEach((c, i) => (t += `<text x="${x + 10}" y="${y + 52 + i * 22}" font-size="13">${esc(c)}</text>`));
    return t;
  }
  let b = table(20, 20, "users", ["PK id", "name", "email (unique)", "password_hash", "timezone", "morning_enabled, morning_time", "evening_enabled, evening_time", "paused", "onboarded_at, created_at"], LIGHT);
  b += table(370, 20, "interests", ["PK, FK user_id", "PK topic"], GREEN);
  b += table(370, 170, "digests", ["PK id", "FK user_id", "slot, digest_date", "status, to_email", "subject, html, text", "article_ids (jsonb)", "delivered_via, error", "created_at", "UNIQUE (user_id, date, slot)"], YELLOW);
  b += table(720, 20, "articles", ["PK id", "link (unique)", "topic, source", "title, excerpt", "summary, summary_model", "is_sample", "published_at, fetched_at"], RED);
  b += `<line x1="270" y1="70" x2="368" y2="70" stroke="#333" stroke-width="1.5"/><text x="280" y="62" font-size="13">1</text><text x="350" y="62" font-size="13">N</text>`;
  b += `<line x1="270" y1="160" x2="368" y2="220" stroke="#333" stroke-width="1.5"/><text x="280" y="152" font-size="13">1</text><text x="345" y="208" font-size="13">N</text>`;
  b += `<line x1="620" y1="300" x2="718" y2="140" stroke="#333" stroke-width="1.5" stroke-dasharray="6 4"/><text x="630" y="230" font-size="12">article_ids</text><text x="630" y="246" font-size="12">refer to</text>`;
  return svg(990, 400, b);
})();

// 4.7 Deployment
D.deploy = (() => {
  let b = box(20, 90, 170, 70, ["Developer", "git push"], LIGHT);
  b += box(250, 90, 170, 70, ["GitHub", "main branch"], GREY);
  b += `<rect x="480" y="15" width="480" height="250" rx="14" fill="#fafcff" stroke="${BLUE}" stroke-width="2"/><text x="720" y="40" text-anchor="middle" font-size="15" font-weight="bold">Railway project: school-projects</text>`;
  b += box(500, 60, 200, 80, ["Build", "npm run build"], YELLOW, { fs: 13 });
  b += box(740, 60, 200, 80, ["Start", "migrate, seed if empty,", "next start"], GREEN, { fs: 13 });
  b += box(500, 170, 200, 70, ["Health check", "/api/health (DB ping)"], LIGHT, { fs: 13 });
  b += box(740, 170, 200, 70, ["PostgreSQL", "newsinmail database"], YELLOW, { fs: 13 });
  b += arrow(190, 125, 248, 125);
  b += arrow(420, 125, 498, 100, "webhook");
  b += arrow(700, 100, 738, 100);
  b += arrow(840, 140, 840, 168);
  b += arrow(740, 205, 702, 205);
  b += box(500, 300, 440, 50, ["Public URL: news-in-mail-production.up.railway.app"], GREY, { fs: 13 });
  b += arrow(720, 265, 720, 298);
  return svg(980, 370, b);
})();

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const [name, content] of Object.entries(D)) {
  await page.setContent(`<html><body style="margin:0">${content}</body></html>`);
  const el = page.locator("svg");
  await el.screenshot({ path: `${OUT}/d-${name}.png` });
}
await browser.close();
console.log("diagrams:", Object.keys(D).join(", "));
