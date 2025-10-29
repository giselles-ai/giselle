ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_organization_db_id_organizations_db_id_fk";
--> statement-breakpoint
ALTER TABLE "teams" DROP CONSTRAINT "teams_organization_db_id_organizations_db_id_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "organization_db_id";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN IF EXISTS "organization_db_id";

DROP TABLE "organizations";--> statement-breakpoint
