import type { FlowTriggerId } from "@giselle-sdk/data-type";
import { useGitHubTrigger } from "../../lib/use-github-trigger";
import { GitHubRepositoryBadge } from "./github-repository-badge";

interface GitHubRepositoryBadgeFromTriggerProps {
	flowTriggerId: FlowTriggerId;
}

/**
 * A component that fetches GitHub repository data from a flow trigger
 * and displays it as a badge
 */
export function GitHubRepositoryBadgeFromTrigger({
	flowTriggerId,
}: GitHubRepositoryBadgeFromTriggerProps) {
	const { isLoading, data } = useGitHubTrigger(flowTriggerId);

	if (isLoading && data === undefined) {
		return null;
	}
	if (data === undefined) {
		return null;
	}

	return (
		<GitHubRepositoryBadge
			owner={data.githubRepositoryFullname.owner}
			repo={data.githubRepositoryFullname.repo}
		/>
	);
}
