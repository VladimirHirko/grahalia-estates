CREATE TYPE "public"."rent_period" AS ENUM('month', 'week', 'day');--> statement-breakpoint
CREATE TYPE "public"."rent_type" AS ENUM('long_term', 'short_term', 'holiday');--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "public_id" varchar(16) NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "rent_type" "rent_type";--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "rent_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "rent_period" "rent_period";--> statement-breakpoint
CREATE UNIQUE INDEX "properties_public_id_unique" ON "properties" USING btree ("public_id");