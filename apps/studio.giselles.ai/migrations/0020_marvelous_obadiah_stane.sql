CREATE TABLE IF NOT EXISTS "github_integration_settings" (
	"id" text NOT NULL,
	"agent_db_id" integer NOT NULL,
	"repository_full_name" text NOT NULL,
	"call_sign" text NOT NULL,
	"event" text NOT NULL,
	"flow_id" text NOT NULL,
	"event_node_mappings" jsonb NOT NULL,
	"next_action" text NOT NULL,
	CONSTRAINT "github_integration_settings_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_integration_settings" ADD CONSTRAINT "github_integration_settings_agent_db_id_agents_db_id_fk" FOREIGN KEY ("agent_db_id") REFERENCES "public"."agents"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
