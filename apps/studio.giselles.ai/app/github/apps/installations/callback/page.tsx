import { saveTeamGitHubAppInstallation } from "@/services/external/github/team-installation";
import type { TeamId } from "@/services/teams";
import { FailurePage, SuccessPage } from "./component";

/**
 * Callback page that handles GitHub App installation process as a server component
 *
 * This page is opened in a popup window when a user installs the GitHub App.
 * It receives installation_id and state parameters, verifies the state,
 * and creates an association between the team and the installation.
 */
export default async function GitHubAppInstallationCallback({
	searchParams,
}: {
	searchParams: Promise<{ installation_id?: string; state?: string }>;
}) {
	const { installation_id: installationId, state } = await searchParams;

	try {
		if (!installationId) {
			throw new Error("No installation ID provided");
		}

		if (!state) {
			throw new Error("No state parameter provided");
		}

		/** @todo Verify signature */
		const teamId = state;
		if (!teamId) {
			throw new Error("Invalid state parameter");
		}

		await saveTeamGitHubAppInstallation(teamId as TeamId, installationId);
		return <SuccessPage />;
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "An unknown error occurred";
		return <FailurePage errorMessage={errorMessage} />;
	}
}
