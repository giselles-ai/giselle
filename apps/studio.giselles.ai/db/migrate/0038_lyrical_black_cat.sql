CREATE TABLE "acts" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"team_db_id" integer NOT NULL,
	"director_db_id" integer NOT NULL,
	"sdk_workspace_id" text NOT NULL,
	"sdk_flow_trigger_id" text NOT NULL,
	"sdk_flow_run_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acts" ADD CONSTRAINT "acts_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acts" ADD CONSTRAINT "acts_director_db_id_users_db_id_fk" FOREIGN KEY ("director_db_id") REFERENCES "public"."users"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acts_team_db_id_index" ON "acts" USING btree ("team_db_id");--> statement-breakpoint
CREATE INDEX "acts_sdk_workspace_id_index" ON "acts" USING btree ("sdk_workspace_id");--> statement-breakpoint
CREATE INDEX "acts_sdk_flow_trigger_id_index" ON "acts" USING btree ("sdk_flow_trigger_id");--> statement-breakpoint
CREATE INDEX "acts_sdk_flow_run_id_index" ON "acts" USING btree ("sdk_flow_run_id");