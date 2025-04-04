import { GitHubIcon } from "../../icons";

export function TitleHeader() {
	return (
		<h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
			<GitHubIcon className="h-6 w-6 text-indigo-400" />
			GitHub Integration
		</h2>
	);
}
