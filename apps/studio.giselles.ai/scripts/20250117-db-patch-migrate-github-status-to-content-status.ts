import { db } from "@/drizzle";

async function main() {
	console.log("Starting migration of GitHub repository status data...");

	const result = await db.execute(`
		INSERT INTO github_repository_content_status (
			repository_index_db_id,
			content_type,
			enabled,
			status,
			last_synced_at,
			metadata,
			error_code,
			retry_after,
			created_at,
			updated_at
		)
		SELECT
			gri.db_id,
			'blob' as content_type,
			true as enabled,
			gri.status,
			CASE
				WHEN gri.last_ingested_commit_sha IS NOT NULL THEN gri.updated_at
				ELSE NULL
			END as last_synced_at,
			CASE
				WHEN gri.last_ingested_commit_sha IS NOT NULL THEN jsonb_build_object('lastIngestedCommitSha', gri.last_ingested_commit_sha)
				ELSE NULL
			END as metadata,
			gri.error_code,
			gri.retry_after,
			NOW() as created_at,
			NOW() as updated_at
		FROM github_repository_index gri
		WHERE NOT EXISTS (
			SELECT 1 FROM github_repository_content_status grcs
			WHERE grcs.repository_index_db_id = gri.db_id
		);
	`);

	console.log(
		`Migration completed successfully! Migrated ${result.rowCount} repositories.`,
	);
}

// Run the migration
main()
	.catch((error) => {
		console.error("Migration failed:", error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
