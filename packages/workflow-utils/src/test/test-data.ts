import type { Connection, Node } from "@giselle-sdk/data-type";

/**
 * Test workspace with multiple workflow chains
 *
 * Workflow Structure:
 *
 * Flow 1: Manual trigger chain
 * - Manual Trigger (nd-y7lLktmB...)
 *   - Status: unconfigured
 *   - Output: connects to →
 * - Text Generation (nd-7cHfwxtE...)
 *   - Model: gemini-2.5-flash
 *   - Prompt: "Hello"
 *   - Output: connects to →
 * - Text Generation (nd-1aXA3izp...)
 *   - Model: gemini-2.5-flash
 *
 * Flow 2: Standalone text generation chain
 * - Text Generation (nd-bDa47yWh...)
 *   - Model: gemini-2.5-pro
 *   - No inputs
 *   - Output: connects to →
 * - Text Generation (nd-d4TuvXgS...)
 *   - Model: gemini-2.5-flash
 *
 * Flow 3: GitHub issue trigger chain
 * - GitHub Trigger (nd-jm0L6gvH...)
 *   - Name: "Created an issue"
 *   - Status: unconfigured
 *   - Outputs:
 *     • title
 *     • body
 *     • repositoryOwner
 *     • repositoryName
 *   - Output: title connects to →
 * - Text Generation (nd-4KPG1AiU...)
 *   - Model: gpt-4o
 *
 * Node Summary:
 * - Total nodes: 7
 * - Triggers: 2 (Manual, GitHub)
 * - Text Generation: 5 (3x gemini-2.5-flash-lite, 1x gemini-2.5-pro, 1x gpt-4o)
 * - Connections: 4
 */
export const testWorkspace1 = {
	id: "wrks-y9HldH2r4OzHlKhd",
	schemaVersion: "20250221",
	nodes: [
		{
			id: "nd-1aXA3izp1yV48mPH",
			type: "operation",
			inputs: [
				{ id: "inp-ToOWmAN6dIhY1Qxa", label: "Input", accessor: "Input" },
			],
			outputs: [
				{
					id: "otp-ohaEJR2OU3n8vool",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					provider: "google",
					id: "gemini-2.5-flash-lite-preview-06-17",
					configurations: {
						temperature: 0.7,
						topP: 1,
						searchGrounding: false,
					},
				},
			},
		},
		{
			id: "nd-y7lLktmBplRvcSov",
			name: "Manual trigger",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-CJwRfFHF6gU3Q527",
					label: "Output",
					accessor: "Output",
				},
			],
			content: {
				type: "trigger",
				provider: "manual",
				state: {
					status: "unconfigured",
				},
			},
		},
		{
			id: "nd-7cHfwxtERI9CPAIt",
			type: "operation",
			inputs: [
				{ id: "inp-kSYSroXpYCjVx4VL", label: "Input", accessor: "Input" },
			],
			outputs: [
				{
					id: "otp-4G1uIyUg1OzinQas",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					provider: "google",
					id: "gemini-2.5-flash-lite-preview-06-17",
					configurations: {
						temperature: 0.7,
						topP: 1,
						searchGrounding: false,
					},
				},
				prompt:
					'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}',
			},
		},
		{
			id: "nd-bDa47yWhthNtESN1",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-HZphv951HS7rMftJ",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					provider: "google",
					id: "gemini-2.5-pro",
					configurations: {
						temperature: 0.7,
						topP: 1,
						searchGrounding: false,
					},
				},
			},
		},
		{
			id: "nd-d4TuvXgSOSkY5zQQ",
			type: "operation",
			inputs: [
				{ id: "inp-ZODlnwVgQhZ0VTWT", label: "Input", accessor: "Input" },
			],
			outputs: [
				{
					id: "otp-DUX9IRy7YDPTNWGC",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					provider: "google",
					id: "gemini-2.5-flash-lite-preview-06-17",
					configurations: {
						temperature: 0.7,
						topP: 1,
						searchGrounding: false,
					},
				},
			},
		},
		{
			id: "nd-jm0L6gvHk4U0eAlz",
			name: "Created an issue",
			type: "operation",
			inputs: [],
			outputs: [
				{ id: "otp-ZxwqRRcamCukeLlX", label: "title", accessor: "title" },
				{ id: "otp-J2FN10NGnFaRJhHV", label: "body", accessor: "body" },
				{
					id: "otp-SZWyvY9t4YfDQDEO",
					label: "repositoryOwner",
					accessor: "repositoryOwner",
				},
				{
					id: "otp-Ma5sUrj3pb2SIzC3",
					label: "repositoryName",
					accessor: "repositoryName",
				},
			],
			content: {
				type: "trigger",
				provider: "github",
				state: {
					status: "unconfigured",
				},
			},
		},
		{
			id: "nd-4KPG1AiUA0mGN94i",
			type: "operation",
			inputs: [
				{ id: "inp-76KjIOKSj4XNuN7w", label: "Input", accessor: "Input" },
			],
			outputs: [
				{
					id: "otp-fYw3FbHY116UcPIE",
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
	] satisfies Node[],
	connections: [
		{
			id: "cnnc-p00GOBR89Pukcgvg",
			outputNode: {
				id: "nd-7cHfwxtERI9CPAIt",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-4G1uIyUg1OzinQas",
			inputNode: {
				id: "nd-1aXA3izp1yV48mPH",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-ToOWmAN6dIhY1Qxa",
		},
		{
			id: "cnnc-1noJE3niIVUFrSQV",
			outputNode: {
				id: "nd-y7lLktmBplRvcSov",
				type: "operation",
				content: { type: "trigger" },
			},
			outputId: "otp-CJwRfFHF6gU3Q527",
			inputNode: {
				id: "nd-7cHfwxtERI9CPAIt",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-kSYSroXpYCjVx4VL",
		},
		{
			id: "cnnc-cGgJsDrM2QNMubR4",
			outputNode: {
				id: "nd-bDa47yWhthNtESN1",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-HZphv951HS7rMftJ",
			inputNode: {
				id: "nd-d4TuvXgSOSkY5zQQ",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-ZODlnwVgQhZ0VTWT",
		},
		{
			id: "cnnc-voTSCaRTEYgpGT1N",
			outputNode: {
				id: "nd-jm0L6gvHk4U0eAlz",
				type: "operation",
				content: { type: "trigger" },
			},
			outputId: "otp-ZxwqRRcamCukeLlX",
			inputNode: {
				id: "nd-4KPG1AiUA0mGN94i",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-76KjIOKSj4XNuN7w",
		},
	] satisfies Connection[],
};
