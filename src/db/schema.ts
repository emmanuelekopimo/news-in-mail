import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  timezone: text("timezone").notNull().default("Africa/Lagos"),
  morningEnabled: boolean("morning_enabled").notNull().default(true),
  morningTime: text("morning_time").notNull().default("07:00"),
  eveningEnabled: boolean("evening_enabled").notNull().default(true),
  eveningTime: text("evening_time").notNull().default("18:00"),
  paused: boolean("paused").notNull().default(false),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const interests = pgTable(
  "interests",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.topic] })],
);

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    link: text("link").notNull().unique(),
    topic: text("topic").notNull(),
    source: text("source").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    summary: text("summary"),
    summaryModel: text("summary_model"),
    isSample: boolean("is_sample").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("articles_topic_published_idx").on(t.topic, t.publishedAt)],
);

export const digests = pgTable(
  "digests",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slot: text("slot", { enum: ["morning", "evening", "test"] }).notNull(),
    digestDate: text("digest_date").notNull(),
    status: text("status", { enum: ["sent", "failed", "skipped"] }).notNull(),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    html: text("html").notNull().default(""),
    text: text("text").notNull().default(""),
    articleIds: jsonb("article_ids").$type<number[]>().notNull().default([]),
    deliveredVia: text("delivered_via").notNull().default("inbox"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("digests_user_date_slot_idx")
      .on(t.userId, t.digestDate, t.slot)
      .where(sql`${t.slot} <> 'test'`),
    index("digests_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Digest = typeof digests.$inferSelect;
