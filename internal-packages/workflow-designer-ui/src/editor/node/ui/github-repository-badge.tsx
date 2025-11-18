import { clsx } from "clsx";

type NodeType = "trigger" | "action" | "vectorStore";

interface GitHubRepositoryBadgeProps {
	owner: string;
	repo: string;
	nodeType?: NodeType;
}

function getBackgroundColorClass(nodeType: NodeType): string {
	switch (nodeType) {
		case "trigger":
			return "bg-trigger-node-1/50";
		case "action":
			return "bg-action-node-1/50";
		default:
			return "bg-github-node-1/50";
	}
}

/**
 * A component that displays a GitHub repository badge
 */
export function GitHubRepositoryBadge({
	owner,
	repo,
	nodeType = "vectorStore",
}: GitHubRepositoryBadgeProps) {
	return (
		<div
			className={clsx(
				"flex items-center rounded-full pl-[16px] pr-[16px] py-1 text-white-200 transition-colors text-[12px]",
				getBackgroundColorClass(nodeType),
			)}
		>
			<div className="space-x-[2px]">
				<span>{owner}</span>
				<span>/</span>
				<span>{repo}</span>
			</div>
		</div>
	);
}
