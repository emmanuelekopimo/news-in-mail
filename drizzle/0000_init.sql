CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"link" text NOT NULL,
	"topic" text NOT NULL,
	"source" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"summary" text,
	"summary_model" text,
	"is_sample" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_link_unique" UNIQUE("link")
);
--> statement-breakpoint
CREATE TABLE "digests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"slot" text NOT NULL,
	"digest_date" text NOT NULL,
	"status" text NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"html" text DEFAULT '' NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"article_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"delivered_via" text DEFAULT 'inbox' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interests" (
	"user_id" integer NOT NULL,
	"topic" text NOT NULL,
	CONSTRAINT "interests_user_id_topic_pk" PRIMARY KEY("user_id","topic")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"timezone" text DEFAULT 'Africa/Lagos' NOT NULL,
	"morning_enabled" boolean DEFAULT true NOT NULL,
	"morning_time" text DEFAULT '07:00' NOT NULL,
	"evening_enabled" boolean DEFAULT true NOT NULL,
	"evening_time" text DEFAULT '18:00' NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "digests" ADD CONSTRAINT "digests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interests" ADD CONSTRAINT "interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articles_topic_published_idx" ON "articles" USING btree ("topic","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "digests_user_date_slot_idx" ON "digests" USING btree ("user_id","digest_date","slot") WHERE "digests"."slot" <> 'test';--> statement-breakpoint
CREATE INDEX "digests_user_created_idx" ON "digests" USING btree ("user_id","created_at");