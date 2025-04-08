import { db } from "@/drizzle";
import { teamGithubAppInstallations, teams } from "@/drizzle/schema";
import type { TeamId } from "@/services/teams/types";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";
import { and, eq } from "drizzle-orm";

/**
 * Repository information from GitHub
 */
export interface Repository {
	id: number;
	name: string;
	full_name: string;
	html_url: string;
	private: boolean;
	description: string | null;
}

/**
 * Installation information with associated repositories
 */
export interface InstallationWithRepositories {
	id: number;
	account: {
		login?: string;
		name?: string;
		avatar_url?: string;
	};
	app_id: number;
	target_id: number;
	target_type: string;
	repositories: Repository[];
}

/**
 * Generate GitHub App installation URL with team context
 *
 * @param teamId - The team ID to associate with the installation
 * @returns The URL for installing the GitHub App
 */
export async function getTeamGitHubAppInstallURL(
	teamId: TeamId,
): Promise<string> {
	try {
		const appId = process.env.GITHUB_APP_ID;
		const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

		if (appId === undefined || privateKey === undefined) {
			throw new Error("Missing GitHub App ID or Private Key");
		}

		const client = new Octokit({
			authStrategy: createAppAuth,
			auth: {
				appId,
				privateKey,
			},
		});
		const res = await client.request("GET /app");
		if (res.status !== 200 || !res.data) {
			throw new Error("Failed to get app information");
		}

		const url = new URL(
			`/apps/${res.data.slug}/installations/new`,
			"https://github.com",
		);
		url.searchParams.append("state", teamId);
		return url.toString();
	} catch (error) {
		throw new Error("Failed to generate GitHub App installation URL");
	}
}

/**
 * Save a GitHub App installation for a team
 *
 * @param teamId - The team ID
 * @param installationId - The GitHub App installation ID
 * @returns The created installation record
 */
export async function saveTeamGitHubAppInstallation(
	teamId: TeamId,
	installationId: number,
): Promise<typeof teamGithubAppInstallations.$inferSelect> {
	try {
		// First, get the team's database ID
		const teamResult = await db
			.select({ dbId: teams.dbId })
			.from(teams)
			.where(eq(teams.id, teamId))
			.limit(1);

		if (teamResult.length === 0) {
			throw new Error(`Team with ID ${teamId} not found`);
		}

		const teamDbId = teamResult[0].dbId;

		// Check if installation already exists for this team
		const existingInstallations = await db
			.select()
			.from(teamGithubAppInstallations)
			.where(
				and(
					eq(teamGithubAppInstallations.teamDbId, teamDbId),
					eq(teamGithubAppInstallations.installationId, installationId),
				),
			);

		if (existingInstallations.length > 0) {
			// Installation already exists, return it
			return existingInstallations[0];
		}

		// Create new installation record
		const [installation] = await db
			.insert(teamGithubAppInstallations)
			.values({
				teamDbId,
				installationId,
			})
			.returning();

		return installation;
	} catch (error) {
		throw new Error(
			`Failed to save GitHub App installation: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Remove a GitHub App installation for a team
 *
 * @param teamId - The team ID
 * @param installationId - The GitHub installation ID to remove
 * @returns True if the installation was removed, false if it wasn't found
 */
export async function removeTeamGitHubAppInstallation(
	teamId: TeamId,
	installationId: number,
) {
	const teamResult = await db
		.select({ dbId: teams.dbId })
		.from(teams)
		.where(eq(teams.id, teamId))
		.limit(1);

	if (teamResult.length === 0) {
		throw new Error(`Team with ID ${teamId} not found`);
	}

	const teamDbId = teamResult[0].dbId;

	await db
		.delete(teamGithubAppInstallations)
		.where(
			and(
				eq(teamGithubAppInstallations.teamDbId, teamDbId),
				eq(teamGithubAppInstallations.installationId, installationId),
			),
		);
}

/**
 * Get all GitHub App installations for a team
 *
 * @param teamId - The team ID
 * @returns Array of installation IDs
 */
export async function getTeamGitHubAppInstallations(teamId: TeamId) {
	// Get the team's database ID
	const teamResult = await db
		.select({ dbId: teams.dbId })
		.from(teams)
		.where(eq(teams.id, teamId))
		.limit(1);

	if (teamResult.length === 0) {
		throw new Error(`Team with ID ${teamId} not found`);
	}

	const teamDbId = teamResult[0].dbId;

	// Get all installations for this team
	const installations = await db
		.select({ installationId: teamGithubAppInstallations.installationId })
		.from(teamGithubAppInstallations)
		.where(eq(teamGithubAppInstallations.teamDbId, teamDbId));

	return installations.map((i) => i.installationId);
}

/**
 * Get detailed information about GitHub installations and repositories for a team
 *
 * @param teamId - The team ID
 * @returns Array of installations with repositories
 */
export async function getTeamGitHubInstallationDetails(
	teamId: TeamId,
): Promise<InstallationWithRepositories[]> {
	const installationIds = await getTeamGitHubAppInstallations(teamId);

	const installationsWithRepos = await Promise.all(
		installationIds.map(async (installationId) => {
			try {
				const appId = process.env.GITHUB_APP_ID;
				const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

				if (appId === undefined || privateKey === undefined) {
					throw new Error("Missing GitHub App ID or Private Key");
				}

				const client = new Octokit({
					authStrategy: createAppAuth,
					auth: {
						appId,
						privateKey,
						installationId,
					},
				});

				// Get installation details
				const installationRes = await client.request(
					"GET /app/installations/{installation_id}",
					{
						installation_id: Number(installationId),
					},
				);

				// Get repositories for this installation
				const reposRes = await client.request(
					"GET /installation/repositories",
					{
						per_page: 100,
					},
				);

				return {
					...installationRes.data,
					repositories: reposRes.data.repositories,
				} as InstallationWithRepositories;
			} catch (error) {
				return {
					id: Number(installationId),
					account: {},
					app_id: 0,
					target_id: 0,
					target_type: "unknown",
					repositories: [],
				} as InstallationWithRepositories;
			}
		}),
	);

	return installationsWithRepos;
}

/**
 * Migrate existing user-based GitHub App installations to team-based ones
 * This is a utility function for the migration process
 */
export async function migrateUserGitHubInstallationsToTeams(): Promise<void> {
	// This would implement migration logic from user-based to team-based installations
	// For example:
	// 1. Get all users and their GitHub installations
	// 2. For each user, determine their primary team
	// 3. Associate the GitHub installations with the team
	//
	// Since this depends on the existing schema structure which we don't have full access to,
	// this is left as a placeholder
	console.info(
		"Migration of GitHub installations to teams is not implemented yet",
	);
}
