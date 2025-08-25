import type { Workspace } from "@giselle-sdk/data-type";

/**
 * Group Nodes Test Fixture
 *
 * Node Structure - Two Separate Connected Components:
 *
 * GROUP 1 (8 nodes, 7 connections) - Large Connected Component:
 *
 *    ┌────────────────┐    ┌────────────────┐
 *    │ CFgMwrVsMDKy68ju│    │ Y7Uh3GvPRIQwfSGE│
 *    │ TextGen (no inp)│    │ TextGen (no inp)│
 *    └────────┬───────┘    └────────┬───────┘
 *             │                     │
 *             ▼                     ▼
 *    ┌────────────────┐    ┌────────────────┐
 *    │ GSCigvQfU7lbDsvy│◄───┤ omdTu2flqJHhMuo8│
 *    │ TextGen (2 inp) │    │ TextGen (1 inp) │
 *    └────────┬───────┘    └─────────────────┘
 *             │
 *             ├─────────────────────────────────────┐
 *             ▼                                     ▼
 *    ┌────────────────┐                   ┌────────────────┐
 *    │ k7ii9Cge2s9XF5JF│                   │ w0tHiwkN3n2ZIP2v│
 *    │ TextGen (2 inp) │                   │ TextGen (1 inp) │
 *    └────────▲───────┘                   └─────────────────┘
 *             │
 *             │
 *    ┌────────────────┐
 *    │ 7bpl4Q81Z97VgDlt│
 *    │ TextGen (1 inp) │
 *    └────────▲───────┘
 *             │
 *             │
 *    ┌────────────────┐
 *    │ OEac8DMOLd0bwsOe│
 *    │ TextGen (no inp)│
 *    └─────────────────┘
 *
 *
 * GROUP 2 (2 nodes, 1 connection) - Simple Chain:
 *
 *    ┌────────────────┐     ┌────────────────┐
 *    │ CH7NalFDDDbHQcr7│────▶│ YkXO5rkuczwTmnmv│
 *    │ TextGen (no inp)│     │ TextGen (1 inp) │
 *    └─────────────────┘     └─────────────────┘
 *
 * Key Points:
 * - Group 1 forms one connected component with complex branching
 * - Group 2 is completely isolated from Group 1
 * - GSCigvQfU7lbDsvy acts as a hub receiving from CFgMwrVsMDKy68ju and omdTu2flqJHhMuo8
 * - GSCigvQfU7lbDsvy then branches to both k7ii9Cge2s9XF5JF and w0tHiwkN3n2ZIP2v
 * - A separate chain: OEac8DMOLd0bwsOe → 7bpl4Q81Z97VgDlt → k7ii9Cge2s9XF5JF
 * - Y7Uh3GvPRIQwfSGE → omdTu2flqJHhMuo8 connects to the main flow
 */
export const gourpNodesFixture: Workspace = {
	id: "wrks-Fa6GSJtQLp2B5kjm",
	schemaVersion: "20250221",
	nodes: [
		{
			id: "nd-CFgMwrVsMDKy68ju",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-jzfjEdlrL0Uxtz9G",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					provider: "openai",
					id: "gpt-4o",
					configurations: {
						temperature: 0.7,
						topP: 1,
						presencePenalty: 0,
						frequencyPenalty: 0,
					},
				},
			},
		},
		{
			id: "nd-omdTu2flqJHhMuo8",
			type: "operation",
			inputs: [
				{
					id: "inp-lqfXNH4WVhmM5z0K",
					label: "Input",
					accessor: "inp-lqfXNH4WVhmM5z0K",
				},
			],
			outputs: [
				{
					id: "otp-Tx4FGbYQa82Nc6Wm",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					provider: "openai",
					id: "gpt-4o",
					configurations: {
						temperature: 0.7,
						topP: 1,
						presencePenalty: 0,
						frequencyPenalty: 0,
					},
				},
			},
		},
		{
			id: "nd-GSCigvQfU7lbDsvy",
			type: "operation",
			inputs: [
				{
					id: "inp-ekm76hUTKOrkzkQy",
					label: "Input",
					accessor: "inp-ekm76hUTKOrkzkQy",
				},
				{
					id: "inp-ykFpFVhW874IMSV8",
					label: "Input",
					accessor: "inp-ykFpFVhW874IMSV8",
				},
			],
			outputs: [
				{
					id: "otp-4FPVboi4ZrTyBdOH",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					provider: "openai",
					id: "gpt-4o",
					configurations: {
						temperature: 0.7,
						topP: 1,
						presencePenalty: 0,
						frequencyPenalty: 0,
					},
				},
			},
		},
		{
			id: "nd-Y7Uh3GvPRIQwfSGE",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-qXHqdw4YyyTRlcQa",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					id: "gpt-4o",
					provider: "openai",
					configurations: {
						temperature: 0.7,
						topP: 1,
						presencePenalty: 0,
						frequencyPenalty: 0,
					},
				},
			},
		},
		{
			id: "nd-CH7NalFDDDbHQcr7",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-ytLlbc7AdGOdcN8x",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					id: "gpt-4o",
					provider: "openai",
					configurations: {
						temperature: 0.7,
						topP: 1,
						presencePenalty: 0,
						frequencyPenalty: 0,
					},
				},
			},
		},
		{
			id: "nd-YkXO5rkuczwTmnmv",
			type: "operation",
			inputs: [
				{
					id: "inp-4u2hldghJAKPzF0Y",
					label: "Input",
					accessor: "inp-4u2hldghJAKPzF0Y",
				},
			],
			outputs: [
				{
					id: "otp-8Ay3f3RS3FCYi5kh",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					id: "gpt-4o",
					provider: "openai",
					configurations: {
						temperature: 0.7,
						topP: 1,
						presencePenalty: 0,
						frequencyPenalty: 0,
					},
				},
			},
		},
		{
			id: "nd-OEac8DMOLd0bwsOe",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-gz2MfgZkic3pOEUQ",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					id: "gpt-4o",
					provider: "openai",
					configurations: {
						temperature: 0.7,
						topP: 1,
						presencePenalty: 0,
						frequencyPenalty: 0,
					},
				},
			},
		},
		{
			id: "nd-7bpl4Q81Z97VgDlt",
			type: "operation",
			inputs: [
				{
					id: "inp-NDJRAczAqOLaBD8d",
					label: "Input",
					accessor: "inp-NDJRAczAqOLaBD8d",
				},
			],
			outputs: [
				{
					id: "otp-eGeBrvlDugp1c5hM",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					id: "gpt-4o",
					provider: "openai",
					configurations: {
						temperature: 0.7,
						topP: 1,
						presencePenalty: 0,
						frequencyPenalty: 0,
					},
				},
			},
		},
		{
			id: "nd-k7ii9Cge2s9XF5JF",
			type: "operation",
			inputs: [
				{
					id: "inp-hhON6XceZKxvgeD0",
					label: "Input",
					accessor: "inp-hhON6XceZKxvgeD0",
				},
				{
					id: "inp-nmFY6CITrBOte81B",
					label: "Input",
					accessor: "inp-nmFY6CITrBOte81B",
				},
			],
			outputs: [
				{
					id: "otp-xVOJ2N7sGLhb6LU0",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					id: "gpt-4o",
					provider: "openai",
					configurations: {
						temperature: 0.7,
						topP: 1,
						presencePenalty: 0,
						frequencyPenalty: 0,
					},
				},
			},
		},
		{
			id: "nd-w0tHiwkN3n2ZIP2v",
			type: "operation",
			inputs: [
				{
					id: "inp-P1ApJeR8Tk3GOH3r",
					label: "Input",
					accessor: "inp-P1ApJeR8Tk3GOH3r",
				},
			],
			outputs: [
				{
					id: "otp-JrMAebF26J7HV3lN",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					id: "gpt-4o",
					provider: "openai",
					configurations: {
						temperature: 0.7,
						topP: 1,
						presencePenalty: 0,
						frequencyPenalty: 0,
					},
				},
			},
		},
	],
	connections: [
		{
			id: "cnnc-Ny22ITWFfxl4dXqG",
			outputNode: {
				id: "nd-CFgMwrVsMDKy68ju",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-jzfjEdlrL0Uxtz9G",
			inputNode: {
				id: "nd-GSCigvQfU7lbDsvy",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-ekm76hUTKOrkzkQy",
		},
		{
			id: "cnnc-MdMbaPN7WM7iOoG5",
			outputNode: {
				id: "nd-omdTu2flqJHhMuo8",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-Tx4FGbYQa82Nc6Wm",
			inputNode: {
				id: "nd-GSCigvQfU7lbDsvy",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-ykFpFVhW874IMSV8",
		},
		{
			id: "cnnc-WhIoZ4KSpF4cAC7P",
			outputNode: {
				id: "nd-Y7Uh3GvPRIQwfSGE",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-qXHqdw4YyyTRlcQa",
			inputNode: {
				id: "nd-omdTu2flqJHhMuo8",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-lqfXNH4WVhmM5z0K",
		},
		{
			id: "cnnc-vjFh74rjVrwiZQbO",
			outputNode: {
				id: "nd-CH7NalFDDDbHQcr7",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-ytLlbc7AdGOdcN8x",
			inputNode: {
				id: "nd-YkXO5rkuczwTmnmv",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-4u2hldghJAKPzF0Y",
		},
		{
			id: "cnnc-fnuwL16Tbh8j8G7X",
			outputNode: {
				id: "nd-OEac8DMOLd0bwsOe",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-gz2MfgZkic3pOEUQ",
			inputNode: {
				id: "nd-7bpl4Q81Z97VgDlt",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-NDJRAczAqOLaBD8d",
		},
		{
			id: "cnnc-ms5EsqhBS0lpIqVB",
			outputNode: {
				id: "nd-7bpl4Q81Z97VgDlt",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-eGeBrvlDugp1c5hM",
			inputNode: {
				id: "nd-k7ii9Cge2s9XF5JF",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-hhON6XceZKxvgeD0",
		},
		{
			id: "cnnc-WWhtU7ekvqWcKdaz",
			outputNode: {
				id: "nd-GSCigvQfU7lbDsvy",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-4FPVboi4ZrTyBdOH",
			inputNode: {
				id: "nd-k7ii9Cge2s9XF5JF",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-nmFY6CITrBOte81B",
		},
		{
			id: "cnnc-PTAKD9l6mOeo7YDY",
			outputNode: {
				id: "nd-GSCigvQfU7lbDsvy",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-4FPVboi4ZrTyBdOH",
			inputNode: {
				id: "nd-w0tHiwkN3n2ZIP2v",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-P1ApJeR8Tk3GOH3r",
		},
	],
	ui: {
		nodeState: {
			"nd-CFgMwrVsMDKy68ju": { position: { x: 285, y: 240 }, selected: false },
			"nd-omdTu2flqJHhMuo8": { position: { x: 300, y: 405 }, selected: false },
			"nd-GSCigvQfU7lbDsvy": { position: { x: 618, y: 255 }, selected: false },
			"nd-Y7Uh3GvPRIQwfSGE": { position: { x: 60, y: 420 }, selected: false },
			"nd-CH7NalFDDDbHQcr7": { position: { x: 285, y: 630 }, selected: false },
			"nd-YkXO5rkuczwTmnmv": { position: { x: 600, y: 645 }, selected: false },
			"nd-OEac8DMOLd0bwsOe": { position: { x: 97, y: 97 }, selected: false },
			"nd-7bpl4Q81Z97VgDlt": { position: { x: 524, y: 103 }, selected: false },
			"nd-k7ii9Cge2s9XF5JF": { position: { x: 923, y: 165 }, selected: false },
			"nd-w0tHiwkN3n2ZIP2v": { position: { x: 911, y: 396 } },
		},
		viewport: { x: 147, y: -69.5, zoom: 1 },
		currentShortcutScope: "canvas" as const,
	},
};
