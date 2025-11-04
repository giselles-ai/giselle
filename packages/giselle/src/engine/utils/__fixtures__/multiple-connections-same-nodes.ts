/**
 * Multiple Connections Between Same Nodes Test Fixture
 *
 * This fixture tests the scenario where one node has multiple outputs
 * connected to the same target node - a common pattern when passing
 * multiple parameters from a trigger to an action.
 *
 * Node Structure:
 *
 * ┌─────────────────────────────┐
 * │ On Issue Comment Created    │
 * │ (GitHub Trigger)            │
 * │ nd-nwdgrtVwC070isLr         │
 * └──┬──────────────┬───────────┘
 *    │              │
 *    │ Issue Number │ Issue Title
 *    │              │
 *    ▼              ▼
 * ┌─────────────────────────────┐
 * │ Create Issue Comment        │
 * │ (GitHub Action)             │
 * │ nd-PlnxfHCFVLCuVJcb         │
 * └─────────────────────────────┘
 *
 * Key Points:
 * - Trigger has 4 outputs: issueComment, issueNumber, issueTitle, issueBody
 * - Action has 2 inputs: issueNumber, body
 * - TWO connections from same trigger to same action:
 *   1. issueNumber (otp-dpz92nyiAVTcoLs6) → issueNumber (inp-rKOQKGqGb7Qeps2X)
 *   2. issueTitle (otp-CTj1biBXwjzZuqNo) → body (inp-FiinOx0HrQqamro9)
 *
 * This tests the bug fix where filter() instead of find() ensures ALL
 * connections between the same two nodes are collected.
 */

import type { Workspace } from "@giselle-ai/data-type";

export const multipleConnectionsSameNodesFixture: Workspace = {
	id: "wrks-JJqRLOtbigJ6Tc58",
	schemaVersion: "20250221",
	nodes: [
		{
			id: "nd-nwdgrtVwC070isLr",
			name: "On Issue Comment Created",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-QAq4xmw2KdTuLgP2",
					label: "Issue Comment",
					accessor: "body",
				},
				{
					id: "otp-dpz92nyiAVTcoLs6",
					label: "Issue Number",
					accessor: "issueNumber",
				},
				{
					id: "otp-CTj1biBXwjzZuqNo",
					label: "Issue Title",
					accessor: "issueTitle",
				},
				{
					id: "otp-Mhi9HxfxtZQ6fcTt",
					label: "Issue Body",
					accessor: "issueBody",
				},
			],
			content: {
				type: "trigger",
				provider: "github",
				state: {
					status: "configured",
					flowTriggerId: "fltg-ZtwjC12CVW5kPdUu",
				},
			},
		},
		{
			id: "nd-PlnxfHCFVLCuVJcb",
			name: "Create Issue Comment",
			type: "operation",
			inputs: [
				{
					id: "inp-rKOQKGqGb7Qeps2X",
					label: "issueNumber",
					accessor: "issueNumber",
					isRequired: true,
				},
				{
					id: "inp-FiinOx0HrQqamro9",
					label: "body",
					accessor: "body",
					isRequired: true,
				},
			],
			outputs: [
				{
					id: "otp-FZaotlnouWEScbaJ",
					label: "output",
					accessor: "action-result",
				},
			],
			content: {
				type: "action",
				command: {
					provider: "github",
					state: {
						status: "configured",
						commandId: "github.create.issueComment",
						repositoryNodeId: "R_kgDON5_TWw",
						installationId: 81253657,
					},
				},
			},
		},
	],
	connections: [
		{
			id: "cnnc-mzeOjkqocn9YFhlD",
			outputNode: {
				id: "nd-nwdgrtVwC070isLr",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-dpz92nyiAVTcoLs6",
			inputNode: {
				id: "nd-PlnxfHCFVLCuVJcb",
				type: "operation",
				content: {
					type: "action",
				},
			},
			inputId: "inp-rKOQKGqGb7Qeps2X",
		},
		{
			id: "cnnc-pf2KwXJAoEEBCE1n",
			outputNode: {
				id: "nd-nwdgrtVwC070isLr",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-CTj1biBXwjzZuqNo",
			inputNode: {
				id: "nd-PlnxfHCFVLCuVJcb",
				type: "operation",
				content: {
					type: "action",
				},
			},
			inputId: "inp-FiinOx0HrQqamro9",
		},
	],
	ui: {
		nodeState: {
			"nd-nwdgrtVwC070isLr": {
				position: {
					x: -199.3909277921317,
					y: 1051.8414322662375,
				},
				selected: true,
				showError: false,
				highlighted: false,
				measured: {
					width: 260,
					height: 260,
				},
			},
			"nd-PlnxfHCFVLCuVJcb": {
				position: {
					x: 310.4926866012552,
					y: 1063.047396001855,
				},
				selected: false,
				showError: false,
				highlighted: false,
				measured: {
					width: 229,
					height: 195,
				},
			},
		},
		viewport: {
			x: 543.0285601454921,
			y: -789.8216993868937,
			zoom: 0.9113626570467636,
		},
		currentShortcutScope: "canvas",
		selectedConnectionIds: [],
	},
};
