import type { ToolProviderConfig } from "./common";

export const githubConfig: ToolProviderConfig<"github"> = {
	key: "github",
	connectionData: (secretId) => ({
		tools: [],
		auth: { type: "secret", secretId },
	}),
	toolCatalog: [
		{
			label: "Repository",
			tools: [
				"createRepository",
				"forkRepository",
				"getFileContents",
				"listBranches",
				"searchCode",
			],
		},
		{
			label: "Issues",
			tools: [
				"createIssue",
				"getIssue",
				"listIssues",
				"searchIssues",
				"updateIssue",
				"addIssueComment",
				"getIssueComments",
			],
		},
		{
			label: "Pull Requests",
			tools: [
				"createPullRequest",
				"getPullRequest",
				"updatePullRequest",
				"listPullRequests",
				"searchPullRequests",
				"getPullRequestComments",
				"getPullRequestFiles",
				"getPullRequestReviews",
				"getPullRequestStatus",
				"createPullRequestReview",
				"addPullRequestReviewComment",
				"mergePullRequest",
				"updatePullRequestBranch",
			],
		},
		{
			label: "Code Management",
			tools: [
				"createBranch",
				"createOrUpdateFile",
				"getCommit",
				"listCommits",
				"listCodeScanningAlerts",
				"getCodeScanningAlert",
			],
		},
		{
			label: "Search",
			tools: [
				"searchCode",
				"searchIssues",
				"searchPullRequests",
				"searchRepositories",
				"searchUsers",
			],
		},
		{
			label: "User",
			tools: ["getMe"],
		},
	],
	strings: {
		connectionTitle: "Connect to GitHub",
		connectionDescription:
			"How would you like to add your Personal Access Token (PAT)?",
		labelLabel: "Token Name",
		labelHelp:
			"Give this token a short name (e.g. \u201CProd-bot\u201D). You\u2019ll use it when linking other nodes.",
		valueLabel: "Personal Access Token (PAT)",
		valueHelp:
			"We\u2019ll encrypt the token with authenticated encryption before saving it.",
		valueLink: {
			href: "https://github.com/settings/personal-access-tokens",
			text: "GitHub",
		},
		createTab: "Paste New Token",
		selectTab: "Use Saved Token",
		selectEmptyDescription: "No saved tokens yet",
		selectEmptyAction: "Save First Token",
		selectInstruction: "Pick one of your encrypted tokens to connect.",
		selectLabel: "Select a saved token",
		selectPlaceholder: "Choose a token… ",
		configurationTitle: "Configuration of GitHub",
		configurationDescription: "Select the GitHub tools you want to enable",
		configuredMessage: "Token configured.",
		resetLabel: "Reset key",
	},
};

export const postgresConfig: ToolProviderConfig<"postgres"> = {
	key: "postgres",
	connectionData: (secretId) => ({ tools: [], secretId }),
	toolCatalog: [
		{ label: "Schema", tools: ["getTableStructure"] },
		{ label: "Query", tools: ["query"] },
	],
	strings: {
		connectionTitle: "Connect to PostgreSQL",
		connectionDescription: "How would you like to add your Connection String?",
		labelLabel: "Connection Name",
		labelHelp:
			"Give this connection a short name (e.g. \u201CProd-DB\u201D). You\u2019ll use it when linking other nodes.",
		valueLabel: "Connection String",
		valueHelp:
			"We\u2019ll encrypt the connection string with authenticated encryption before saving it.",
		createTab: "Paste New String",
		selectTab: "Use Saved String",
		selectEmptyDescription: "No saved connection strings yet",
		selectEmptyAction: "Save First connection string",
		selectInstruction: "Pick one of your encrypted strings to connect.",
		selectLabel: "Select a saved connection string",
		selectPlaceholder: "Choose a connection string… ",
		configurationTitle: "Configuration of PostgreSQL",
		configurationDescription: "Select the PostgreSQL tools you want to enable",
		configuredMessage: "Connection configured.",
		resetLabel: "Reset",
	},
};
