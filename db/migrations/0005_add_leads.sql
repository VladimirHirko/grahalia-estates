CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(60) NOT NULL,
	"email" varchar(160) NOT NULL,
	"message" text,
	"lang" varchar(2) NOT NULL,
	"page_url" text NOT NULL,
	"property_id" integer,
	"property_slug" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "description_es" text;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;