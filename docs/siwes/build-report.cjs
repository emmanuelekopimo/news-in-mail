// Builds the SIWES report as a .docx in the format of the sample report.
// Usage: node docs/siwes/build-report.cjs [pages.json]
// pages.json (optional) maps headings, figure and table captions to page labels
// for the table of contents and lists. find-pages.py produces it from a rendered PDF.
const fs = require("fs");
const path = require("path");
const {
  AlignmentType, BorderStyle, Document, Footer, ImageRun, LevelFormat, Packer, PageBreak, PageNumber,
  NumberFormat, Paragraph, ShadingType, Table, TableCell, TableRow, TabStopType, TextRun, WidthType,
  SectionType, LineRuleType, TableLayoutType, VerticalAlign, HeadingLevel,
} = require("docx");
const C = require("./content.cjs");

const IMG = path.join(__dirname, "img");
const pagesFile = process.argv[2];
const pages = pagesFile && fs.existsSync(pagesFile) ? JSON.parse(fs.readFileSync(pagesFile, "utf8")) : {};
const OUT = process.argv[3] ?? path.join(__dirname, "SIWES_Report_Friday_Godswill_Essien_23-SC-CO-158.docx");

const FONT = "Times New Roman";
const BODY = 24; // 12 pt
const LINE = 312; // 1.3 line spacing, as in the sample
const CM = 567; // twips per cm
const TEXT_WIDTH = 9072; // A4 width minus 2.5 cm margins each side

function run(text, o = {}) {
  return new TextRun({ text, font: FONT, size: o.size ?? BODY, bold: o.bold, italics: o.italics, allCaps: o.caps });
}
function para(text, o = {}) {
  return new Paragraph({
    alignment: o.align ?? AlignmentType.JUSTIFIED,
    spacing: { line: o.line ?? LINE, lineRule: LineRuleType.AUTO, before: o.before ?? 0, after: o.after ?? 140 },
    indent: o.indent,
    keepNext: o.keepNext,
    children: Array.isArray(text) ? text : [run(text, o)],
    heading: o.heading,
    pageBreakBefore: o.pageBreakBefore,
  });
}

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), data: b };
}
function image(file, widthCm) {
  const { w, h, data } = pngSize(path.join(IMG, file));
  const wpx = Math.round(widthCm * 37.8);
  return new ImageRun({ type: "png", data, transformation: { width: wpx, height: Math.round((wpx * h) / w) } });
}

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
function table(t) {
  const total = t.widths.reduce((a, b) => a + b, 0);
  const rows = t.rows.map(
    (r, i) =>
      new TableRow({
        tableHeader: i === 0,
        cantSplit: true,
        children: r.map(
          (c, j) =>
            new TableCell({
              borders,
              width: { size: t.widths[j], type: WidthType.DXA },
              shading: i === 0 ? { type: ShadingType.CLEAR, fill: "D9E2F3", color: "auto" } : undefined,
              margins: { top: 50, bottom: 50, left: 100, right: 100 },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  spacing: { line: 252, lineRule: LineRuleType.AUTO, before: 0, after: 0 },
                  children: [run(c, { size: 22, bold: i === 0 })],
                }),
              ],
            }),
        ),
      }),
  );
  return [
    para(t.caption, { align: AlignmentType.CENTER, bold: true, size: 22, keepNext: true, after: 80, before: 120 }),
    new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: t.widths, layout: TableLayoutType.FIXED, rows, alignment: AlignmentType.CENTER }),
    para("", { after: 120 }),
  ];
}

function heading1(lines) {
  return lines.map((l, i) =>
    new Paragraph({
      heading: i === 0 ? HeadingLevel.HEADING_1 : undefined,
      alignment: AlignmentType.CENTER,
      pageBreakBefore: i === 0,
      keepNext: true,
      spacing: { before: 0, after: i === lines.length - 1 ? 360 : 60, line: LINE, lineRule: LineRuleType.AUTO },
      children: [run(l, { bold: i < 2, size: i < 2 ? 28 : 24, italics: i === 2 })],
    }),
  );
}

function blocks(list) {
  const out = [];
  for (const b of list) {
    if (b.h1) out.push(...heading1(b.h1));
    else if (b.h2) out.push(para(b.h2, { bold: true, align: AlignmentType.LEFT, keepNext: true, before: 200, after: 120, heading: HeadingLevel.HEADING_2 }));
    else if (b.h3) out.push(para(b.h3, { bold: true, italics: true, align: AlignmentType.LEFT, keepNext: true, before: 120, after: 100, heading: HeadingLevel.HEADING_3 }));
    else if (b.p !== undefined) out.push(para(b.p));
    else if (b.bullets)
      for (const t of b.bullets)
        out.push(new Paragraph({ numbering: { reference: "bullets", level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { line: LINE, lineRule: LineRuleType.AUTO, after: 80 }, children: [run(t)] }));
    else if (b.numbered)
      for (const t of b.numbered)
        out.push(new Paragraph({ numbering: { reference: "numbers", level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { line: LINE, lineRule: LineRuleType.AUTO, after: 80 }, children: [run(t)] }));
    else if (b.fig) {
      out.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 }, children: [image(b.fig.file, b.fig.width)] }));
      out.push(para(b.fig.caption, { align: AlignmentType.CENTER, bold: true, size: 22, after: 200 }));
    } else if (b.figs) {
      out.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 }, children: [image(b.figs.files[0], b.figs.width), run("      "), image(b.figs.files[1], b.figs.width)] }));
      out.push(para(b.figs.caption, { align: AlignmentType.CENTER, bold: true, size: 22, after: 200 }));
    } else if (b.table) out.push(...table(b.table));
    else if (b.code)
      out.push(
        new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: "F2F2F2", color: "auto" },
          border: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
          spacing: { before: 60, after: 200, line: 240, lineRule: LineRuleType.AUTO },
          children: b.code.flatMap((l, i) => [new TextRun({ text: l, font: "Courier New", size: 17, break: i ? 1 : 0 })]),
        }),
      );
  }
  return out;
}

// ---------- Front matter ----------
const S = C.STUDENT;
const titleLines = [
  ["REPORT ON STUDENT INDUSTRIAL WORK EXPERIENCE SCHEME (SIWES)", 28, true, 0],
  ["EXPERIENCES AND MINI PROJECT UNDERTAKEN AT", 24, true, 400],
  ["START INNOVATION HUB, UYO, AKWA IBOM STATE", 26, true, 0],
  ["ON", 24, true, 400],
  ["NEWS IN MAIL: A PERSONALISED NEWS BRIEFING SYSTEM WITH SCHEDULED EMAIL DELIVERY AND AI SUMMARIES", 26, true, 400],
  ["BY", 24, true, 600],
  [S.name, 26, true, 200],
  [S.reg, 26, true, 0],
  ["DEPARTMENT OF COMPUTER SCIENCE, FACULTY OF COMPUTING", 24, true, 600],
  ["UNIVERSITY OF UYO, UYO, AKWA IBOM STATE", 24, true, 0],
  ["COURSE CODE: CSC 329", 24, true, 500],
  ["SUBMITTED TO: DEPARTMENT OF COMPUTER SCIENCE, FACULTY OF COMPUTING, UNIVERSITY OF UYO, UYO, AKWA IBOM STATE", 24, false, 500],
  ["IN PARTIAL FULFILMENT OF THE REQUIREMENT FOR THE AWARD OF A BACHELOR OF SCIENCE (B.SC) DEGREE IN COMPUTER SCIENCE", 24, false, 400],
  ["OCTOBER, 2026", 24, true, 600],
];
const titlePage = titleLines.map(([t, size, bold, before]) =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before, after: 80, line: 300, lineRule: LineRuleType.AUTO }, children: [run(t, { size, bold })] }),
);

function frontHeading(t, first = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    pageBreakBefore: !first,
    spacing: { after: 360 },
    children: [run(t, { bold: true, size: 28 })],
  });
}

function signLine(role) {
  return [
    new Paragraph({ spacing: { before: 700, after: 0 }, tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }], children: [run("..............................................."), run("\t.............................")] }),
    new Paragraph({ spacing: { after: 0 }, tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }], children: [run(role, { bold: true }), run("\tDate")] }),
  ];
}
const certification = [
  frontHeading("CERTIFICATION", true),
  para(`This is to certify that this report on the Student Industrial Work Experience Scheme (SIWES) undertaken at Start Innovation Hub, Uyo, Akwa Ibom State, was carried out and written by ${S.name.replace(",", "")} with registration number ${S.reg}, of the Department of Computer Science, Faculty of Computing, University of Uyo, and has been approved as meeting the requirements of the course CSC 329.`, { before: 400 }),
  ...signLine("Industry-Based Supervisor, Start Innovation Hub"),
  ...signLine("Departmental SIWES Coordinator"),
  ...signLine("Head of Department, Computer Science"),
];
const dedication = [
  frontHeading("DEDICATION"),
  para("I dedicate this report to God Almighty, the source of my life, strength and wisdom, and to my parents and family, whose love, prayers and support carried me through my industrial training.", { align: AlignmentType.CENTER, before: 1200 }),
];
const acknowledgement = [
  frontHeading("ACKNOWLEDGEMENT"),
  para("My first thanks go to God Almighty for His grace, protection and guidance from the first day of my industrial training to the completion of this report."),
  para("I am grateful to the management of Start Innovation Hub, Uyo, and to its Chief Executive Officer, Mr Hanson Johnson, for accepting me as an intern and giving me real work. I sincerely thank my industry supervisor and the developers of the Software Development unit, who patiently taught me, reviewed my code and trusted me with real projects. I also thank the training team for allowing me to assist at classes and at the Kids Bootcamp, and my fellow interns for the shared challenges and the friendly competition that pushed all of us to do better."),
  para("I appreciate the Head of Department, my departmental SIWES coordinator and all the lecturers of the Department of Computer Science, University of Uyo, for the knowledge that prepared me for this training and for their guidance on this report. I also thank the Industrial Training Fund for organising the scheme."),
  para("Finally, I am deeply thankful to my parents and family for their encouragement, prayers and financial support throughout my training."),
];
const abstract = [
  frontHeading("ABSTRACT"),
  para("This report presents my experience during the Student Industrial Work Experience Scheme (SIWES) at Start Innovation Hub, Uyo, Akwa Ibom State, from April to September 2026, where I was attached to the Software Development unit. It begins with a history of SIWES and a profile of Start Innovation Hub, a technology hub founded in 2014 that has trained more than 4,000 young people in digital skills, supported 13 startups and builds websites and applications for clients."),
  para("My work centred on web and backend development. I built strong foundations in HTML, CSS, JavaScript, TypeScript, React and Next.js, then focused on backend development: REST APIs with Node.js and Express, PostgreSQL database design and SQL, input validation, authentication with hashed passwords and signed tokens, and security practices. I worked in a team with Git and pull requests, built an event registration API, contributed to a client website, and assisted instructors during training sessions."),
  para("For my mini project I designed and built News in Mail, a web application that lets readers choose topics and delivery times and then sends them a personalised news briefing every morning and evening. The system collects stories from 20 free RSS feeds, picks fresh stories for each reader without repeats, summarises them with a large language model through OpenRouter, and records every briefing as sent, failed or skipped. A test email is sent as soon as a reader finishes onboarding. Built with Next.js, TypeScript, Drizzle ORM and PostgreSQL, the system passed 77 automated tests and is deployed on Railway."),
];

// Table of contents and lists, filled from pages.json on the second pass.
function tocLine(text, page, level) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH, leader: "dot" }],
    indent: { left: level === 1 ? 0 : level === 2 ? 360 : 720 },
    spacing: { before: level === 1 ? 100 : 0, after: 30, line: 264, lineRule: LineRuleType.AUTO },
    children: [run(text, { bold: level === 1, size: level === 1 ? 23 : 22 }), run(`\t${page ?? ""}`, { size: 22 })],
  });
}

const PROPER = { siwes: "SIWES", nigeria: "Nigeria", start: "Start", innovation: "Innovation", hub: "Hub", "node.js": "Node.js", "next.js": "Next.js", api: "API", sql: "SQL", ai: "AI", git: "Git", news: "News", mail: "Mail", rss: "RSS" };
function tocTitle(h) {
  const m = /^(\d+\.\d+) (.*)$/.exec(h);
  const words = m[2].toLowerCase().split(" ").map((w) => PROPER[w] ?? w);
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return `${m[1]}  ${words.join(" ")}`;
}
const chapters = [C.chapter1, C.chapter2, C.chapter3, C.chapter4, C.chapter5];
const tocEntries = [
  ["CERTIFICATION", 1], ["DEDICATION", 1], ["ACKNOWLEDGEMENT", 1], ["ABSTRACT", 1], ["LIST OF FIGURES", 1], ["LIST OF TABLES", 1],
];
for (const ch of chapters)
  for (const b of ch) {
    if (b.h1) tocEntries.push([`${b.h1[0]}: ${b.h1[1]}`, 1, b.h1[0]]);
    if (b.h2) tocEntries.push([tocTitle(b.h2), 2, b.h2]);
    if (b.h3) tocEntries.push([b.h3, 3, b.h3]);
  }
tocEntries.push(["REFERENCES", 1, "REFERENCES"], ["APPENDIX: LIVE SYSTEM AND SOURCE CODE", 1, "APPENDIX"]);

const figs = [];
const tabs = [];
for (const ch of chapters)
  for (const b of ch) {
    if (b.fig) figs.push(b.fig.caption);
    if (b.figs) figs.push(b.figs.caption);
    if (b.table) tabs.push(b.table.caption);
  }

const toc = [frontHeading("TABLE OF CONTENTS"), ...tocEntries.map(([t, lvl, key]) => tocLine(t, pages[key ?? t], lvl))];
const lof = [frontHeading("LIST OF FIGURES"), ...figs.map((f) => tocLine(f, pages[f.split(":")[0]], 2))];
const lot = [frontHeading("LIST OF TABLES"), ...tabs.map((f) => tocLine(f, pages[f.split(":")[0]], 2))];

// ---------- Body ----------
const body = [];
for (const ch of chapters) body.push(...blocks(ch));
body.push(...heading1(["REFERENCES"]));
for (const r of C.references)
  body.push(new Paragraph({ alignment: AlignmentType.LEFT, indent: { left: 567, hanging: 567 }, spacing: { after: 120, line: 276, lineRule: LineRuleType.AUTO }, children: [run(r)] }));
body.push(...blocks(C.appendix));

function footer(format) {
  return new Footer({
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 22 })] })],
  });
}
const page = {
  size: { width: 11906, height: 16838 },
  margin: { top: 1418, bottom: 1418, left: 1418, right: 1418, footer: 567 },
};

const doc = new Document({
  creator: S.name,
  title: "SIWES Report - Start Innovation Hub - News in Mail",
  styles: {
    default: { document: { run: { font: FONT, size: BODY } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 28, bold: true }, paragraph: { outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 24, bold: true }, paragraph: { outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 24, bold: true }, paragraph: { outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.LOWER_ROMAN, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 400 } } } }] },
    ],
  },
  sections: [
    { properties: { page }, children: titlePage },
    {
      properties: { page: { ...page, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } }, type: SectionType.NEXT_PAGE },
      footers: { default: footer() },
      children: [...certification, ...dedication, ...acknowledgement, ...abstract, ...toc, ...lof, ...lot],
    },
    {
      properties: { page: { ...page, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } }, type: SectionType.NEXT_PAGE },
      footers: { default: footer() },
      children: body,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  // Lookup keys for find-pages.py: chapter/section headings and captions.
  const keys = {
    front: ["CERTIFICATION", "DEDICATION", "ACKNOWLEDGEMENT", "ABSTRACT", "LIST OF FIGURES", "LIST OF TABLES"],
    body: tocEntries.slice(6).map(([, , k]) => k),
    captions: [...figs, ...tabs].map((f) => f.split(":")[0]),
  };
  fs.writeFileSync(path.join(__dirname, "keys.json"), JSON.stringify(keys, null, 1));
  console.log("wrote", OUT);
});
