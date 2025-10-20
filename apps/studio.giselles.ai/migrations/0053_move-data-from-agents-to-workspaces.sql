INSERT INTO "workspaces" (
	"id",
	"name",
	"team_db_id",
	"created_at",
	"updated_at",
	"creator_db_id"
)
SELECT
	a."workspace_id",
	a."name",
	a."team_db_id",
	a."created_at",
	a."updated_at",
	a."creator_db_id"
FROM "agents" AS a
WHERE a."workspace_id" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
