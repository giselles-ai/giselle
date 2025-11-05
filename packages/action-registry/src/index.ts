import {
	GitHubActionCommand,
	type GitHubActionCommandId,
	GithubCreateIssueActionCommand,
} from "@giselles-ai/protocol";
import z from "zod/v4";

interface PayloadItem {
	key: string;
	label: string;
	type: "string" | "number";
	optional?: boolean;
}

const githubActionRegistry = z.registry<{
	id: GitHubActionCommandId;
	label: string;
	payload: PayloadItem[];
}>();

githubActionRegistry.add(GithubCreateIssueActionCommand, {
	id: GithubCreateIssueActionCommand.shape.id.value,
	label: "Create Issue",
	payload: [
		{
			key: "title",
			label: "Title",
			type: "string",
		},
		{
			key: "body",
			label: "Body",
			type: "string",
		},
	],
});

export const githubActionOptions = GitHubActionCommand.options
	.map((githubActionSchema) => {
		const registryData = githubActionRegistry.get(githubActionSchema);
		if (registryData === undefined) {
			return null;
		}
		return registryData;
	})
	.filter((registry) => registry !== null);

export function findGitHubActionOption(
	githubActionCommandId: GitHubActionCommandId,
) {
	return githubActionOptions.find(
		(option) => option.id === githubActionCommandId,
	);
}
