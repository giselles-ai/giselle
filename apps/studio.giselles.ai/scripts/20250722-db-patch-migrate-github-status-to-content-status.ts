import { db } from "@/db";

async function main() {
	console.log(
		"Starting idempotent migration of GitHub repository status data...",
	);

	await db.transaction(async (tx) => {
		// Step 1: Delete records that don't exist in source table anymore
		const deleteResult = await tx.execute(`
			DELETE FROM github_repository_content_status grcs
			WHERE grcs.content_type = 'blob'
			AND NOT EXISTS (
				SELECT 1 FROM github_repository_index gri
				WHERE gri.db_id = grcs.repository_index_db_id
			);
		`);
		console.log(`Deleted ${deleteResult.rowCount} orphaned records.`);

		// Step 2: Insert or update records using ON CONFLICT
		const upsertResult = await tx.execute(`
			INSERT INTO github_repository_content_status (
				repository_index_db_id,
				content_type,
				enabled,
				status,
				last_synced_at,
				metadata,
				error_code,
				retry_after,
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
				gri.updated_at
			FROM github_repository_index gri
			ON CONFLICT (repository_index_db_id, content_type) DO UPDATE SET
				enabled = EXCLUDED.enabled,
				status = EXCLUDED.status,
				last_synced_at = EXCLUDED.last_synced_at,
				metadata = EXCLUDED.metadata,
				error_code = EXCLUDED.error_code,
				retry_after = EXCLUDED.retry_after,
				updated_at = EXCLUDED.updated_at;
		`);

		console.log(
			`Migration completed successfully! Upserted ${upsertResult.rowCount} repositories.`,
		);
	});
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
