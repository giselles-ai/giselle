import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db, githubRepositoryIndex } from "@/drizzle";
import { fetchCurrentTeam } from "@/services/teams";

export async function GET(_request: NextRequest) {
	// Only allow in development environment
	if (process.env.NODE_ENV !== "development") {
		return new Response("Not available in production", {
			status: 403,
		});
	}

	try {
		const team = await fetchCurrentTeam();

		// Fetch all vector stores for the current team
		const vectorStores = await db
			.select()
			.from(githubRepositoryIndex)
			.where(eq(githubRepositoryIndex.teamDbId, team.dbId));

		// Check required environment variables
		const requiredEnvVars = [
			"GITHUB_APP_ID",
			"GITHUB_APP_PRIVATE_KEY",
			"GITHUB_APP_CLIENT_ID",
			"GITHUB_APP_CLIENT_SECRET",
			"CRON_SECRET",
		];

		const missingEnvVars = requiredEnvVars.filter(
			(envVar) => !process.env[envVar],
		);

		// Calculate status counts
		const statusCounts = vectorStores.reduce(
			(acc, store) => {
				acc[store.status] = (acc[store.status] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		const diagnosis = {
			timestamp: new Date().toISOString(),
			teamId: team.id,
			teamDbId: team.dbId,
			vectorStores: vectorStores.map((store) => ({
				id: store.id,
				owner: store.owner,
				repo: store.repo,
				status: store.status,
				errorCode: store.errorCode,
				retryAfter: store.retryAfter,
				lastIngestedCommitSha: store.lastIngestedCommitSha,
				createdAt: store.createdAt,
				updatedAt: store.updatedAt,
			})),
			statusCounts,
			environmentCheck: {
				missingEnvVars,
				hasRequiredEnvVars: missingEnvVars.length === 0,
			},
			cronJobInfo: {
				endpoint: "/api/vector-stores/github/ingest",
				schedule: "*/10 * * * *",
				testEndpoint: "/api/vector-stores/github/ingest/test",
			},
		};

		return new Response(JSON.stringify(diagnosis, null, 2), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("Error in vector store status diagnosis:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to diagnose vector store status",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}
