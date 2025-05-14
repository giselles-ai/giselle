import { useGiselleEngine } from "giselle-sdk/react";
import useSWR from "swr";
import { GitHubRepositoryBadge } from "./github-repository-badge";

export interface GitHubRepositoryBadgeFromRepoProps {
	installationId: number;
	repositoryNodeId: string;
}

/**
 * A component that fetches GitHub repository data by installation ID and repository node ID
 * and displays it as a badge
 */
export function GitHubRepositoryBadgeFromRepo({
	installationId,
	repositoryNodeId,
}: GitHubRepositoryBadgeFromRepoProps) {
	const client = useGiselleEngine();
	const { isLoading, data } = useSWR(
		{
			installationId,
			repositoryNodeId,
		},
		({ installationId, repositoryNodeId }) =>
			client.getGitHubRepositoryFullname({
				installationId,
				repositoryNodeId,
			}),
	);

	if (isLoading) {
		return null;
	}
	if (data === undefined) {
		return null;
	}

	return (
		<GitHubRepositoryBadge
			owner={data.fullname.owner}
			repo={data.fullname.repo}
		/>
	);
}

export default GitHubRepositoryBadgeFromRepo;
