import clsx from "clsx/lite";
import { GitHubIcon } from "../../../../../../icons";

interface RepositoryDisplayProps {
	owner: string;
	repo: string;
	className?: string;
}

export function RepositoryDisplay({
	owner,
	repo,
	className,
}: RepositoryDisplayProps) {
	return (
		<div className={clsx("flex flex-col gap-1", className)}>
			<div className="flex items-center gap-2">
				<GitHubIcon className="size-[16px] text-white" />
				<span className="text-sm font-medium text-white">
					{owner}/{repo}
				</span>
			</div>
		</div>
	);
}
