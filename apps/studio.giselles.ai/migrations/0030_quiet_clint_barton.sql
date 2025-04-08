CREATE TABLE "team_github_app_installations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_db_id" integer NOT NULL,
	"installation_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_github_app_installations_team_db_id_installation_id_unique" UNIQUE("team_db_id","installation_id")
);
--> statement-breakpoint
ALTER TABLE "team_github_app_installations" ADD CONSTRAINT "team_github_app_installations_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_github_app_installations_team_db_id_index" ON "team_github_app_installations" USING btree ("team_db_id");--> statement-breakpoint
CREATE INDEX "team_github_app_installations_installation_id_index" ON "team_github_app_installations" USING btree ("installation_id");