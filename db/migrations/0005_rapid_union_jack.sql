ALTER TABLE "leads" ADD COLUMN "status" varchar(20) DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "source" varchar(80);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "processed_at" timestamp with time zone;