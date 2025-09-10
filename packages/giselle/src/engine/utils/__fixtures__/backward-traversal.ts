import type { Workspace } from "@giselle-sdk/data-type";

/**
 * Backward Traversal Test Fixture
 *
 * Node Structure:
 *
 * ┌─────────────────┐     ┌────────────────┐     ┌────────────────┐
 * │ Variable        │     │ Manual Trigger │     │ TGA1           │
 * │ nd-TuATf8...    │     │ A              │     │ nd-J154b...    │
 * │ "関西弁で"      │     │ nd-CWGF6...    │     │                │
 * └────────┬────────┘     └────────┬───────┘     └────────┬───────┘
 *          │                       │                       │
 *          ├───────────────────────┴───────────────────────┘
 *          │                                               │
 *          ▼                                               ▼
 * ┌─────────────────┐                                      │
 * │ TGA2            │◄─────────────────────────────────────┘
 * │ nd-IRHq5...     │
 * │ (3 inputs)      │
 * └─────────────────┘
 *
 *
 * ┌─────────────────┐     ┌────────────────┐     ┌────────────────┐
 * │ Variable        │     │ Manual Trigger │     │ TGB1           │
 * │ nd-TuATf8...    │     │ B              │     │ nd-9gSP...     │
 * │ "関西弁で"      │     │ nd-4rgk3...    │     │                │
 * └────────┬────────┘     └────────┬───────┘     └────────┬───────┘
 *          │                       │                       │
 *          ├───────────────────────┴───────────────────────┘
 *          │                                               │
 *          ▼                                               ▼
 * ┌─────────────────┐                                      │
 * │ TGB2            │◄─────────────────────────────────────┘
 * │ nd-cKT1V...     │
 * │ (3 inputs)      │
 * └─────────────────┘
 *
 * Key Points:
 * - Variable node is shared between both flows
 * - TGA2 receives inputs from Variable, Manual Trigger A, and TGA1
 * - TGB2 receives inputs from Variable, Manual Trigger B, and TGB1
 * - When starting from TGA2 with backward traversal:
 *   - Should find: Variable, Manual Trigger A, TGA1, and TGA2 itself
 *   - Should NOT find: Manual Trigger B, TGB1, or TGB2 (different flow)
 */
export const backwardTraversalFixture = {
	id: "wrks-hl32oC44J4VhC3Vl",
	schemaVersion: "20250221",
	nodes: [
		{
			id: "nd-IRHq5YW3n2CroK79",
			name: "TGA2",
			type: "operation",
			inputs: [
				{
					id: "inp-cft8AO3qR2JWgTMS",
					label: "Input",
					accessor: "inp-cft8AO3qR2JWgTMS",
				},
				{
					id: "inp-5Sn7vYsM1OjMrXnF",
					label: "Input",
					accessor: "inp-5Sn7vYsM1OjMrXnF",
				},
				{
					id: "inp-QLrE2hVXgl1bJ96U",
					label: "Input",
					accessor: "inp-QLrE2hVXgl1bJ96U",
				},
			],
			outputs: [
				{
					id: "otp-tnvZ7H8fIzFRBAuR",
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
				prompt:
					'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Please tell me about "},{"type":"Source","attrs":{"node":{"id":"nd-CWGF6MO4nyzPpjJM","type":"operation","content":{"type":"trigger"}},"outputId":"otp-CudyGfYTa6rcrvBY"}},{"type":"text","text":" with "},{"type":"Source","attrs":{"node":{"id":"nd-TuATf8CniAaZuYSk","type":"variable","content":{"type":"text"}},"outputId":"otp-ctcqQkbTj4tW7AaT"}},{"type":"text","text":" "}]}]}',
			},
		},
		{
			id: "nd-cKT1VnN0HwYhGHBG",
			name: "TGB2",
			type: "operation",
			inputs: [
				{
					id: "inp-Az8hz0omsm85VghH",
					label: "Input",
					accessor: "inp-Az8hz0omsm85VghH",
				},
				{
					id: "inp-3sAsUuDoLfYOiQo6",
					label: "Input",
					accessor: "inp-3sAsUuDoLfYOiQo6",
				},
				{
					id: "inp-3cs9lqGnH2kglavk",
					label: "Input",
					accessor: "inp-3cs9lqGnH2kglavk",
				},
			],
			outputs: [
				{
					id: "otp-TZFsF4MmkJG5YXIc",
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
				prompt:
					'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Please tell me about "},{"type":"Source","attrs":{"node":{"id":"nd-4rgk30ypWv13sOEX","type":"operation","content":{"type":"trigger"}},"outputId":"otp-Z9gLosLjMHKHB3cy"}},{"type":"text","text":"  with "},{"type":"Source","attrs":{"node":{"id":"nd-TuATf8CniAaZuYSk","type":"variable","inputs":[],"outputs":[{"id":"otp-ctcqQkbTj4tW7AaT","label":"Output","accessor":"text"}],"content":{"type":"text","text":"{\\"type\\":\\"doc\\",\\"content\\":[{\\"type\\":\\"paragraph\\",\\"content\\":[{\\"type\\":\\"text\\",\\"text\\":\\"関西弁で\\"}]}]}"}},"outputId":"otp-ctcqQkbTj4tW7AaT"}},{"type":"text","text":" "}]}]}',
			},
		},
		{
			id: "nd-TuATf8CniAaZuYSk",
			type: "variable",
			inputs: [],
			outputs: [
				{ id: "otp-ctcqQkbTj4tW7AaT", label: "Output", accessor: "text" },
			],
			content: {
				type: "text",
				text: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"関西弁で"}]}]}',
			},
		},
		{
			id: "nd-CWGF6MO4nyzPpjJM",
			name: "Manual Trigger A",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-CudyGfYTa6rcrvBY",
					label: "A",
					accessor: "mntgp-1DsuPGV80xAXzVtz",
				},
			],
			content: {
				type: "trigger",
				provider: "manual",
				state: { status: "configured", flowTriggerId: "fltg-0tyWnIkAR1zi8IVs" },
			},
		},
		{
			id: "nd-4rgk30ypWv13sOEX",
			name: "Manual Trigger B",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-Z9gLosLjMHKHB3cy",
					label: "B",
					accessor: "mntgp-99CSVTGmP8ep7kPd",
				},
			],
			content: {
				type: "trigger",
				provider: "manual",
				state: { status: "configured", flowTriggerId: "fltg-uD9AfJrS0qfXMkMV" },
			},
		},
		{
			id: "nd-J154bodtpS9bEtx1",
			name: "TGA1",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-5U4NmwqvlSjjYbcS",
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
			id: "nd-9gSPuOSKVrDPxLFZ",
			name: "TGB1",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-HXZczpCWc0i3slzk",
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
			id: "cnnc-777MuPE1oXAAKysb",
			outputNode: {
				id: "nd-TuATf8CniAaZuYSk",
				type: "variable",
				content: { type: "text" },
			},
			outputId: "otp-ctcqQkbTj4tW7AaT",
			inputNode: {
				id: "nd-IRHq5YW3n2CroK79",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-cft8AO3qR2JWgTMS",
		},
		{
			id: "cnnc-n8tdkspIpnf72UHP",
			outputNode: {
				id: "nd-TuATf8CniAaZuYSk",
				type: "variable",
				content: { type: "text" },
			},
			outputId: "otp-ctcqQkbTj4tW7AaT",
			inputNode: {
				id: "nd-cKT1VnN0HwYhGHBG",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-Az8hz0omsm85VghH",
		},
		{
			id: "cnnc-vYEfxqxb1XLZJaQd",
			outputNode: {
				id: "nd-CWGF6MO4nyzPpjJM",
				type: "operation",
				content: { type: "trigger" },
			},
			outputId: "otp-CudyGfYTa6rcrvBY",
			inputNode: {
				id: "nd-IRHq5YW3n2CroK79",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-5Sn7vYsM1OjMrXnF",
		},
		{
			id: "cnnc-QFRBz9Y06xCx80oL",
			outputNode: {
				id: "nd-4rgk30ypWv13sOEX",
				type: "operation",
				content: { type: "trigger" },
			},
			outputId: "otp-Z9gLosLjMHKHB3cy",
			inputNode: {
				id: "nd-cKT1VnN0HwYhGHBG",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-3sAsUuDoLfYOiQo6",
		},
		{
			id: "cnnc-ejmL0pjWE8o85r3m",
			outputNode: {
				id: "nd-J154bodtpS9bEtx1",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-5U4NmwqvlSjjYbcS",
			inputNode: {
				id: "nd-IRHq5YW3n2CroK79",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-QLrE2hVXgl1bJ96U",
		},
		{
			id: "cnnc-JGf9hBrBsy4DXunz",
			outputNode: {
				id: "nd-9gSPuOSKVrDPxLFZ",
				type: "operation",
				content: { type: "textGeneration" },
			},
			outputId: "otp-HXZczpCWc0i3slzk",
			inputNode: {
				id: "nd-cKT1VnN0HwYhGHBG",
				type: "operation",
				content: { type: "textGeneration" },
			},
			inputId: "inp-3cs9lqGnH2kglavk",
		},
	],
	ui: {
		nodeState: {
			"nd-IRHq5YW3n2CroK79": {
				position: { x: 499, y: 119 },
				selected: false,
				highlighted: false,
			},
			"nd-cKT1VnN0HwYhGHBG": {
				position: { x: 442, y: 367 },
				selected: false,
				highlighted: false,
			},
			"nd-TuATf8CniAaZuYSk": {
				position: { x: 121, y: 33 },
				selected: false,
				highlighted: false,
			},
			"nd-CWGF6MO4nyzPpjJM": {
				position: { x: 123, y: 155 },
				selected: false,
				highlighted: false,
			},
			"nd-4rgk30ypWv13sOEX": {
				position: { x: 102, y: 421 },
				selected: false,
				highlighted: false,
			},
			"nd-J154bodtpS9bEtx1": { position: { x: 120, y: 285 }, selected: false },
			"nd-9gSPuOSKVrDPxLFZ": { position: { x: 105, y: 538 }, selected: true },
		},
		viewport: {
			x: -2.472920723190896,
			y: -5.057234271750758,
			zoom: 1.011139282536896,
		},
		currentShortcutScope: "canvas" as const,
		selectedConnectionIds: [],
	},
} satisfies Workspace;
