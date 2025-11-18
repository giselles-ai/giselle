import { getGitHubIdentityState } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import { getGitHubVectorStoreQuota } from "@/services/teams/plan-features/github-vector-store";
import {
	deleteRepositoryIndex,
	registerRepositoryIndex,
	triggerManualIngest,
	updateRepositoryIndex,
} from "./actions";
import { getGitHubRepositoryIndexes, getInstallationsWithRepos } from "./data";
import { RepositoryList } from "./repository-list";
import { RepositoryRegistrationDialog } from "./repository-registration-dialog";
import {
	GitHubAppInstallRequiredCard,
	GitHubAuthErrorCard,
	GitHubAuthRequiredCard,
} from "./status-cards";

export default async function TeamVectorStorePage() {
	const githubIdentityState = await getGitHubIdentityState();

	if (
		githubIdentityState.status === "unauthorized" ||
		githubIdentityState.status === "invalid-credential"
	) {
		return <GitHubAuthRequiredCard />;
	}

	if (githubIdentityState.status === "error") {
		return (
			<GitHubAuthErrorCard errorMessage={githubIdentityState.errorMessage} />
		);
	}

	const userClient = githubIdentityState.gitHubUserClient;
	const installationData = await userClient.getInstallations();
	if (installationData.total_count === 0) {
		return <GitHubAppInstallRequiredCard />;
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
		? "GitHub Vector Stores are available on Pro or Team plans."
		: hasReachedLimit
			? "You've reached the number of GitHub Vector Stores included in your plan."
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
