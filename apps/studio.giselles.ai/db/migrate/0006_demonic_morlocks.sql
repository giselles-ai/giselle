CREATE TABLE IF NOT EXISTS "github_integrations" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"agent_db_id" integer NOT NULL,
	"repository_full_name" text NOT NULL,
	"call_sign" text NOT NULL,
	"event" text NOT NULL,
	"start_node_id" text NOT NULL,
	"end_node_id" text NOT NULL,
	"next_action" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_integrations" ADD CONSTRAINT "github_integrations_agent_db_id_agents_db_id_fk" FOREIGN KEY ("agent_db_id") REFERENCES "public"."agents"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_integrations_repository_full_name_index" ON "github_integrations" USING btree ("repository_full_name");