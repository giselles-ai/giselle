CREATE TABLE "apps" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"team_db_id" integer NOT NULL,
	"workspace_db_id" integer NOT NULL,
	"app_entry_node_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_workspace_db_id_workspaces_db_id_fk" FOREIGN KEY ("workspace_db_id") REFERENCES "public"."workspaces"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "apps_app_entry_node_id_index" ON "apps" USING btree ("app_entry_node_id");--> statement-breakpoint
CREATE INDEX "apps_team_db_id_index" ON "apps" USING btree ("team_db_id");
