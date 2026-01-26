CREATE TABLE "lead_rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "lead_rate_limits_ip_idx" ON "lead_rate_limits" USING btree ("ip");--> statement-breakpoint
CREATE INDEX "lead_rate_limits_created_at_idx" ON "lead_rate_limits" USING btree ("created_at");