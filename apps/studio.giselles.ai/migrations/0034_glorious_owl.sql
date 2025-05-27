CREATE TABLE IF NOT EXISTS "model_usage" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"team_db_id" integer NOT NULL,
	"model" text NOT NULL,
	"provider" text NOT NULL,
	"agent_db_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_usage_items" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"model_usage_db_id" integer NOT NULL,
	"usage_metric" text NOT NULL,
	"amount" integer NOT NULL,
	"unit" text NOT NULL,
	"ended_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "model_usage" ADD CONSTRAINT "model_usage_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "model_usage" ADD CONSTRAINT "model_usage_agent_db_id_agents_db_id_fk" FOREIGN KEY ("agent_db_id") REFERENCES "public"."agents"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "model_usage_items" ADD CONSTRAINT "model_usage_items_model_usage_db_id_model_usage_db_id_fk" FOREIGN KEY ("model_usage_db_id") REFERENCES "public"."model_usage"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
