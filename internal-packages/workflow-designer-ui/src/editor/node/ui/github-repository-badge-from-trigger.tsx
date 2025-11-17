import type { TriggerId } from "@giselles-ai/protocol";
import { useGitHubTrigger } from "../../lib/use-github-trigger";
import { GitHubRepositoryBadge } from "./github-repository-badge";

interface GitHubRepositoryBadgeFromTriggerProps {
	triggerId: TriggerId;
}

/**
 * A component that fetches GitHub repository data from a flow trigger
 * and displays it as a badge
 */
export function GitHubRepositoryBadgeFromTrigger({
	triggerId,
}: GitHubRepositoryBadgeFromTriggerProps) {
	const { isLoading, data } = useGitHubTrigger(triggerId);

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
			nodeType="trigger"
		/>
	);
}
