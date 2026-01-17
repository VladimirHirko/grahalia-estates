ALTER TABLE "properties" ADD COLUMN "plot_area_m2" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "built_area_m2" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "terrace_area_m2" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "plans_url" text;--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "area_m2";