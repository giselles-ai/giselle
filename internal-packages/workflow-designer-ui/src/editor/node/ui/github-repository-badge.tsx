import type { FlowTriggerId } from "@giselle-sdk/data-type";
import type React from "react";
import { GitHubIcon } from "../../../icons";
import { useGitHubTrigger } from "../../lib/use-github-trigger";

export interface GitHubRepositoryLinkProps
	extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	flowTriggerId: FlowTriggerId;
}

/**
 * A component that displays a GitHub repository link with the GitHub icon
 */
export const GitHubRepositoryBadge: React.FC<GitHubRepositoryLinkProps> = ({
	flowTriggerId,
}) => {
	const { isLoading, data } = useGitHubTrigger(flowTriggerId);

	if (isLoading) {
		return null;
	}
	if (data === undefined) {
		return null;
	}

	return (
		<div className="flex items-center gap-[6px] rounded-full bg-black-900 pl-[10px] pr-[12px] py-2 text-sm text-white-200 transition-colors text-[12px]">
			<GitHubIcon className="size-[18px]" />
			<div className="space-x-[2px]">
				<span>{data.githubRepositoryFullname.owner}</span>
				<span>/</span>
				<span>{data.githubRepositoryFullname.repo}</span>
			</div>
		</div>
	);
};

export default GitHubRepositoryBadge;
