UPDATE "teams" SET "plan" = 'internal' WHERE "type" = 'internal';
--> statement-breakpoint
UPDATE "teams"
SET "plan" = 'pro'
WHERE "type" <> 'internal'
	AND "db_id" IN (
		SELECT DISTINCT "team_db_id"
		FROM "subscriptions"
		WHERE "status" = 'active'
	);
