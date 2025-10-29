ALTER TABLE "workspaces" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "team_db_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;