import { useGiselle } from "@giselles-ai/react";
import useSWR from "swr";
import { useAppDesignerStore } from "../../../app-designer";
import { GitHubRepositoryBadge } from "./github-repository-badge";

interface GitHubRepositoryBadgeFromRepoProps {
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
	const client = useGiselle();
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const { isLoading, data } = useSWR(
		{
			installationId,
			repositoryNodeId,
			workspaceId,
		},
		({ installationId, repositoryNodeId, workspaceId }) =>
			client.getGitHubRepositoryFullname({
				installationId,
				repositoryNodeId,
				workspaceId,
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
			nodeType="action"
		/>
	);
}
