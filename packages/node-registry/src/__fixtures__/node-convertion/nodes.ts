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

export const openAIWithoutTools = {
	id: "nd-yOa9TSRJc54RE8eO",
	name: "Simple gpt-4o",
	type: "operation",
	inputs: [],
	outputs: [
		{
			id: "otp-Lka0KbJ1UdRcoMfo",
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
				reasoningEffort: "minimal",
			},
		},
		prompt:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"hello"}]}]}',
	},
};

export const openAIWithEmptyTools = {
	id: "nd-0M5ZFOERMZHFDonz",
	type: "operation",
	inputs: [],
	outputs: [
		{
			id: "otp-AkDJCnsuSgHkFYbI",
			label: "Output",
			accessor: "generated-text",
		},
	],
	content: {
		type: "textGeneration",
		llm: {
			provider: "openai",
			id: "gpt-5-nano",
			configurations: {
				temperature: 0.7,
				topP: 1,
				presencePenalty: 0,
				frequencyPenalty: 0,
				textVerbosity: "medium",
				reasoningEffort: "minimal",
			},
		},
		prompt:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Please tell me React.js"}]}]}',
		tools: {},
	},
};

export const anthropicClaudeSonnet = {
	id: "nd-TgsASBm3TvV4mZhs",
	name: "Claude 4 Sonnet with Reasoning",
	type: "operation",
	inputs: [],
	outputs: [
		{
			id: "otp-bSeZklOS4SeDOxOC",
			label: "Output",
			accessor: "generated-text",
		},
	],
	content: {
		type: "textGeneration",
		llm: {
			provider: "anthropic",
			id: "claude-sonnet-4-5-20250929",
			configurations: {
				temperature: 0.7,
				topP: 1,
				reasoningText: false,
			},
		},
		prompt:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"前提条件"},{"type":"text","text":"："},{"type":"text","marks":[{"type":"bold"}],"text":"Nは100〜250の整数"},{"type":"text","text":"。"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"(a) "},{"type":"text","marks":[{"type":"bold"}],"text":"9の倍数"},{"type":"text","text":"。"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"(b) "},{"type":"text","marks":[{"type":"bold"}],"text":"5の倍数"},{"type":"text","text":"。"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"(c) "},{"type":"text","marks":[{"type":"bold"}],"text":"7進表記で回文（3桁）"},{"type":"text","text":"、すなわち "},{"type":"text","marks":[{"type":"bold"}],"text":"N = 50a + 7b"},{"type":"text","text":"（a∈{2,3,4}, b∈{0..6}）。"}]}]}]},{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"問"},{"type":"text","text":"：Nを求めよ。"}]},{"type":"paragraph"},{"type":"paragraph","content":[{"type":"text","text":"You must outputs number only"}]}]}',
	},
};

export const googleGemini = {
	id: "nd-xBohbqzL9DYoB3ZV",
	name: "Gemini with Search Ground",
	type: "operation",
	inputs: [],
	outputs: [
		{
			id: "otp-4VahC7DQM3wdS9Oz",
			label: "Output",
			accessor: "generated-text",
		},
		{
			id: "otp-T1xldRRNegME5OUU",
			label: "Source",
			accessor: "source",
		},
	],
	content: {
		type: "textGeneration",
		llm: {
			provider: "google",
			id: "gemini-2.5-flash",
			configurations: {
				temperature: 0.7,
				topP: 1,
				searchGrounding: true,
				urlContext: false,
			},
		},
		prompt:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"京都市右京区太秦、太映通り商店街に「アララ」という洋食店はありますか？Webを検索し"}]},{"type":"paragraph","content":[{"type":"text","text":"Yes/Noのみを出力してください。"}]}]}',
	},
};
