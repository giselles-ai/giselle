export const openAI_1 = {
	id: "nd-K7A6Z47BciyY7bgM",
	name: "gpt-4o with WebSeach",
	type: "operation",
	inputs: [],
	outputs: [
		{
			id: "otp-4ajhN84n2Eymd7yv",
			label: "Output",
			accessor: "generated-text",
		},
		{
			id: "otp-MaAOA3E42gpYqKSJ",
			label: "Source",
			accessor: "source",
		},
	],
	content: {
		type: "textGeneration",
		llm: {
			provider: "openai",
			id: "gpt-5",
			configurations: {
				temperature: 0.7,
				topP: 1,
				presencePenalty: 0,
				frequencyPenalty: 0,
				textVerbosity: "medium",
				reasoningEffort: "medium",
			},
		},
		prompt:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"京都市右京区太秦、太映通り商店街に「アララ」という洋食店はありますか？Webを検索し"}]},{"type":"paragraph","content":[{"type":"text","text":"Yes/Noのみを出力してください。"}]}]}',
		tools: { openaiWebSearch: { searchContextSize: "medium" } },
	},
};

export const openAIWithGitHubTool = {
	id: "nd-zoKSng6c4Bx5OtdP",
	name: "GitHub Tool",
	type: "operation",
	inputs: [],
	outputs: [
		{
			id: "otp-YiuNn2ZyF13IHVoD",
			label: "Output",
			accessor: "generated-text",
		},
	],
	content: {
		type: "textGeneration",
		llm: {
			provider: "openai",
			id: "gpt-5",
			configurations: {
				temperature: 0.7,
				topP: 1,
				presencePenalty: 0,
				frequencyPenalty: 0,
				textVerbosity: "medium",
				reasoningEffort: "medium",
			},
		},
		prompt:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"https://github.com/toyamarinyon/raula/issues/36 "}]}]}',
		tools: {
			github: {
				tools: ["getIssue"],
				auth: { type: "secret", secretId: "scrt-TESTTESTTESTTEST" },
			},
		},
	},
};
