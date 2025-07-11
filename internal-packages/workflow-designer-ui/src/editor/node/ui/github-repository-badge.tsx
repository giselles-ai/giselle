import { GitHubIcon } from "../../../icons";

interface GitHubRepositoryBadgeProps {
	owner: string;
	repo: string;
}

/**
 * A component that displays a GitHub repository badge with the GitHub icon
 */
export function GitHubRepositoryBadge({
	owner,
	repo,
}: GitHubRepositoryBadgeProps) {
	return (
		<div className="flex items-center gap-[6px] rounded-full bg-black-900 pl-[10px] pr-[12px] py-2 text-white-200 transition-colors text-[12px]">
			<GitHubIcon className="size-[18px]" />
			<div className="space-x-[2px]">
				<span>{owner}</span>
				<span>/</span>
				<span>{repo}</span>
			</div>
		</div>
	);
}
