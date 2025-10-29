CREATE TABLE "flow_triggers" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"team_db_id" integer NOT NULL,
	"staged" boolean DEFAULT false NOT NULL,
	"workspace_id" text NOT NULL,
	"flow_trigger_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flow_triggers" ADD CONSTRAINT "flow_triggers_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flow_triggers_team_db_id_index" ON "flow_triggers" USING btree ("team_db_id");--> statement-breakpoint
CREATE INDEX "flow_triggers_staged_index" ON "flow_triggers" USING btree ("staged");
