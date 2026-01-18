ALTER TABLE "properties" ADD COLUMN "property_type" varchar(24);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "condition" varchar(24);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "status" varchar(16) DEFAULT 'available' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "city" varchar(80);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "area" varchar(80);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "subarea" varchar(80);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "lat" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "lng" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "floor" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "total_floors" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "community_fees_month" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "ibi_year" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "garbage_tax_year" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "orientation" varchar(2);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "energy_rating" varchar(1);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "year_built" integer;