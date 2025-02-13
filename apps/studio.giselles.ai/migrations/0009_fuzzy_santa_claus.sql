-- Add team_db_id column without NOT NULL constraint first
ALTER TABLE "subscriptions" ADD COLUMN "team_db_id" integer;
--> statement-breakpoint

-- Migrate data: Set team_db_id based on organization relationship
UPDATE subscriptions
SET team_db_id = (
    SELECT db_id
    FROM teams
    WHERE organization_db_id = subscriptions.organization_db_id
);
--> statement-breakpoint

-- Add NOT NULL constraint after data migration
ALTER TABLE "subscriptions" ALTER COLUMN "team_db_id" SET NOT NULL;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
