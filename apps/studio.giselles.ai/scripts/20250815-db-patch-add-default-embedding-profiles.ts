/**
 * Script to add default embedding profiles to GitHub repositories
 *
 * This maintenance script ensures all GitHub repository indexes have a default
 * embedding profile assigned. This is needed for repositories created between
 * the migration run and branch merge.
 *
 * Usage:
 *   cd apps/studio.giselles.ai
 *   pnpm dlx tsx --env-file=.env.local scripts/20250815-db-patch-add-default-embedding-profiles.ts
 */

import { db } from "@/drizzle";

const DEFAULT_EMBEDDING_PROFILE_ID = 1;

async function main() {
	console.log(
		"Starting maintenance: Adding default embedding profiles to GitHub repositories...",
	);

	// Insert default embedding profile for all repositories
	// ON CONFLICT DO NOTHING ensures idempotency
	const result = await db.execute(`
		INSERT INTO "github_repository_embedding_profiles" ("repository_index_db_id", "embedding_profile_id")
		SELECT "db_id", ${DEFAULT_EMBEDDING_PROFILE_ID} 
		FROM "github_repository_index"
		ON CONFLICT DO NOTHING;
	`);

	console.log(
		`✅ Added default embedding profile to ${result.rowCount} repositories.`,
	);
}

// Run the maintenance script
main()
	.catch((error) => {
		console.error("Maintenance failed:", error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
