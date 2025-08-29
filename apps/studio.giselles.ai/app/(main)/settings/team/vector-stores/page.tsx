import { ExternalLink } from "lucide-react";
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
			<div className="flex justify-between items-center">
				<h1
					className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
					style={{
						textShadow: "0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
					}}
				>
					Vector Stores
				</h1>
				<div className="flex items-center gap-4">
					<a
						href="https://docs.giselles.ai/guides/settings/team/vector-store"
						target="_blank"
						rel="noopener noreferrer"
						className="text-black-300 text-[14px] font-medium rounded-[4px] px-1.5 py-0.5 hover:bg-black-300/10 flex items-center gap-1.5 font-sans"
					>
						About Vector Stores
						<ExternalLink size={14} />
					</a>
					<RepositoryRegistrationDialog
						installationsWithRepos={installationsWithRepos}
						registerRepositoryIndexAction={registerRepositoryIndex}
					/>
				</div>
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
