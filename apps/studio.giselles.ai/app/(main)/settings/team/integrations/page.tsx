import {
	getTeamGitHubAppInstallURL,
	getTeamGitHubInstallationDetails,
} from "@/services/external/github/team-installation";
import { fetchCurrentTeam } from "@/services/teams";
import GitHubIntegration from "./github-integration";

export default async function TeamIntegrationsPage() {
	const team = await fetchCurrentTeam();
	const [installationUrl, installations] = await Promise.all([
		getTeamGitHubAppInstallURL(team.id),
		getTeamGitHubInstallationDetails(team.id),
	]);

	return (
		<div className="flex flex-col gap-[24px]">
			<h3
				className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				Integration
			</h3>
			<div className="flex flex-col gap-y-4">
				<GitHubIntegration
					teamId={team.id}
					installationUrl={installationUrl}
					installations={installations}
				/>
			</div>
		</div>
	);
}
