import { getGitHubIdentityState } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import { getGitHubVectorStoreQuota } from "@/services/teams/plan-features/github-vector-store";
import {
	deleteRepositoryIndex,
	registerRepositoryIndex,
	triggerManualIngest,
	updateRepositoryIndex,
} from "./actions";
import {
	getGitHubRepositoryIndexes,
	getInstallationsWithRepos,
	getOfficialGitHubRepositoryIndexes,
} from "./data";
import { OfficialRepositorySection } from "./official-repository-section";
import { RepositoryList } from "./repository-list";
import { RepositoryRegistrationDialog } from "./repository-registration-dialog";
import {
	GitHubAppInstallRequiredCard,
	GitHubAuthErrorCard,
	GitHubAuthRequiredCard,
} from "./status-cards";

export default async function TeamVectorStorePage() {
	const [githubIdentityState, officialRepositoryIndexes] = await Promise.all([
		getGitHubIdentityState(),
		getOfficialGitHubRepositoryIndexes(),
	]);

	if (
		githubIdentityState.status === "unauthorized" ||
		githubIdentityState.status === "invalid-credential"
	) {
		return (
			<div className="flex flex-col gap-[24px]">
				<GitHubAuthRequiredCard />
				<OfficialRepositorySection repositories={officialRepositoryIndexes} />
			</div>
		);
	}

	if (githubIdentityState.status === "error") {
		return (
			<div className="flex flex-col gap-[24px]">
				<GitHubAuthErrorCard errorMessage={githubIdentityState.errorMessage} />
				<OfficialRepositorySection repositories={officialRepositoryIndexes} />
			</div>
		);
	}

	const userClient = githubIdentityState.gitHubUserClient;
	const installationData = await userClient.getInstallations();
	if (installationData.total_count === 0) {
		return (
			<div className="flex flex-col gap-[24px]">
				<GitHubAppInstallRequiredCard />
				<OfficialRepositorySection repositories={officialRepositoryIndexes} />
			</div>
		);
	}

	const [installationsWithRepos, repositoryIndexes, team] = await Promise.all([
		getInstallationsWithRepos(),
		getGitHubRepositoryIndexes(),
		fetchCurrentTeam(),
	]);

	const quota = getGitHubVectorStoreQuota(team.plan);
	const hasAccess = quota.isAvailable;
	const hasReachedLimit =
		hasAccess && repositoryIndexes.length >= quota.maxStores;
	const registerDisabled = !hasAccess || hasReachedLimit;
	const registerDisabledReason = !hasAccess
		? "GitHub Vector Stores are available with the Pro or Team plans."
		: hasReachedLimit
			? "You've reached the maximum number of GitHub Vector Stores included in your plan."
			: undefined;

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-end">
				<RepositoryRegistrationDialog
					installationsWithRepos={installationsWithRepos}
					registerRepositoryIndexAction={registerRepositoryIndex}
					disabled={registerDisabled}
					disabledReason={registerDisabledReason}
				/>
			</div>
			<RepositoryList
				repositories={repositoryIndexes}
				officialRepositories={officialRepositoryIndexes}
				deleteRepositoryIndexAction={deleteRepositoryIndex}
				triggerManualIngestAction={triggerManualIngest}
				updateRepositoryIndexAction={updateRepositoryIndex}
				hasAccess={hasAccess}
				maxStores={quota.maxStores}
				teamPlan={team.plan}
			/>
		</div>
	);
}
