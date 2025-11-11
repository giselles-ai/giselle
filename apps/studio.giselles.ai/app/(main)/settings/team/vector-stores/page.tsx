import { getGitHubIdentityState } from "@/services/accounts";
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

	const [installationsWithRepos, repositoryIndexes] = await Promise.all([
		getInstallationsWithRepos(),
		getGitHubRepositoryIndexes(),
	]);

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-end">
				<RepositoryRegistrationDialog
					installationsWithRepos={installationsWithRepos}
					registerRepositoryIndexAction={registerRepositoryIndex}
				/>
			</div>
			<RepositoryList
				repositories={repositoryIndexes}
				deleteRepositoryIndexAction={deleteRepositoryIndex}
				triggerManualIngestAction={triggerManualIngest}
				updateRepositoryIndexAction={updateRepositoryIndex}
			/>
		</div>
	);
}
