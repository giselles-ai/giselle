interface GitHubRepositoryBadgeProps {
	owner: string;
	repo: string;
}

/**
 * A component that displays a GitHub repository badge
 */
export function GitHubRepositoryBadge({
	owner,
	repo,
}: GitHubRepositoryBadgeProps) {
	return (
		<div className="flex items-center rounded-full bg-surface pl-[16px] pr-[16px] py-2 text-white-200 transition-colors text-[12px]">
			<div className="space-x-[2px]">
				<span>{owner}</span>
				<span>/</span>
				<span>{repo}</span>
			</div>
		</div>
	);
}
