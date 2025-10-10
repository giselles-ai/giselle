import { DocsLink } from "@giselle-internal/ui/docs-link";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import { docVectorStoreFlag } from "@/flags";
import { getGitHubIdentityState } from "@/services/accounts";
import {
	deleteRepositoryIndex,
	registerRepositoryIndex,
	triggerManualIngest,
	updateRepositoryIndex,
} from "./actions";
import { getGitHubRepositoryIndexes, getInstallationsWithRepos } from "./data";
import { VectorStoresNavigationLayout } from "./navigation-layout";
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

	const [installationsWithRepos, repositoryIndexes, isDocVectorStoreEnabled] =
		await Promise.all([
			getInstallationsWithRepos(),
			getGitHubRepositoryIndexes(),
			docVectorStoreFlag(),
		]);

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<PageHeading glow>Vector Stores</PageHeading>
				<div className="flex items-center gap-4">
					<DocsLink href="https://docs.giselles.ai/guides/settings/team/vector-store">
						About Vector Stores
					</DocsLink>
					<RepositoryRegistrationDialog
						installationsWithRepos={installationsWithRepos}
						registerRepositoryIndexAction={registerRepositoryIndex}
					/>
				</div>
			</div>
			<VectorStoresNavigationLayout isEnabled={isDocVectorStoreEnabled}>
				<RepositoryList
					repositories={repositoryIndexes}
					deleteRepositoryIndexAction={deleteRepositoryIndex}
					triggerManualIngestAction={triggerManualIngest}
					updateRepositoryIndexAction={updateRepositoryIndex}
				/>
			</VectorStoresNavigationLayout>
		</div>
	);
}
