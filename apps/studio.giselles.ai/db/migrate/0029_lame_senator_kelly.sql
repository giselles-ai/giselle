CREATE TABLE IF NOT EXISTS "agent_time_restrictions" (
	"team_db_id" integer PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_time_restrictions" ADD CONSTRAINT "agent_time_restrictions_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_time_restrictions_team_db_id_index" ON "agent_time_restrictions" USING btree ("team_db_id");