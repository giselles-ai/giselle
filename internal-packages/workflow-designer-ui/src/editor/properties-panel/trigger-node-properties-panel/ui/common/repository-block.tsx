import { GitHubIcon } from "../../../../../icons";

export function GitHubRepositoryBlock({
	owner,
	repo,
}: {
	owner: string;
	repo: string;
}) {
	return (
		<div className="flex items-center gap-[8px] bg-black-800 px-[14px] py-[10px] rounded-[4px]">
			<GitHubIcon className="size-[20px]" />
			<p className="space-x-[2px]">
				<span>{owner}</span>
				<span>/</span>
				<span>{repo}</span>
			</p>
		</div>
	);
}
