import type { Workspace } from "@giselle-sdk/data-type";

/**
 * Two Trigger Test Fixture - GitHub Pull Request QA Workflow
 *
 * Node Structure - Two Parallel GitHub Trigger Flows:
 *
 * FLOW 1: Pull Request Ready for Review → Manual QA → Comment
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ nd-5JoATar9nEGbObfu                                                │
 * │ "On Pull Request Ready for Review" (GitHub Trigger)                │
 * │ Outputs: title, body, number, diff, pullRequestUrl                 │
 * └───┬─────────────────────────┬─────────────────────┬─────────────────┘
 *     │                         │                     │
 *     │ title                   │ body                │ diff
 *     │                         │                     │
 *     ▼                         ▼                     ▼
 * ┌───────────────────────┐ ┌───────────────────────┐ │
 * │ nd-ySQi0YbUMoNsELO3  │ │ nd-0RVsikMQqKwRMWuZ  │ │
 * │ "Manual QA"          │ │ "Prompt for AI Agents"│ │
 * │ (TextGen)            │ │ (TextGen)             │ │
 * └───────┬───────────────┘ └───────┬───────────────┘ │
 *         │                         │                 │
 *         │ generated-text          │ generated-text  │
 *         │   ┌─────────────────────┘                 │
 *         │   │   ┌─────────────────────────────────────┘
 *         │   │   │
 *         │   │   │   ┌─────────────────────────────────┐
 *         │   │   │   │ nd-xcv9NFBilDvWKyYG            │
 *         │   │   │   │ "Template for commenting..."   │
 *         │   │   │   │ (Variable)                     │
 *         │   │   │   └───────┬─────────────────────────┘
 *         │   │   │           │ text
 *         ▼   ▼   ▼           ▼
 *     ┌─────────────────────────────────┐
 *     │ nd-worigWCbqYT9Ofye             │
 *     │ "Create a Comment for PR"       │
 *     │ (TextGen)                       │
 *     └─────────────┬───────────────────┘
 *                   │ generated-text
 *                   ▼
 *     ┌─────────────────────────────────┐
 *     │ nd-Dd7brCDUvMmBK9De             │◄─── number (from trigger)
 *     │ "Create Pull Request Comment"   │
 *     │ (GitHub Action)                 │
 *     └─────────────────────────────────┘
 *
 *
 * FLOW 2: Pull Request Opened → Manual QA → Comment
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ nd-FoP9shtlUFMU5zcI                                                │
 * │ "On Pull Request Opened" (GitHub Trigger)                          │
 * │ Outputs: title, body, number, diff, pullRequestUrl                 │
 * └───┬─────────────────────────┬─────────────────────┬─────────────────┘
 *     │                         │                     │
 *     │ title                   │ body                │ diff & pullRequestUrl
 *     │                         │                     │
 *     ▼                         ▼                     ▼
 * ┌───────────────────────┐ ┌───────────────────────┐ │
 * │ nd-ZEMYDrI7lolEeMEJ  │ │ nd-pLEJoQT8VDAJ1Ewx  │ │
 * │ "Manual QA"          │ │ "Prompt for AI Agents"│ │
 * │ (TextGen)            │ │ (TextGen)             │ │
 * └───────┬───────────────┘ └───────┬───────────────┘ │
 *         │                         │                 │
 *         │ generated-text          │ generated-text  │
 *         │   ┌─────────────────────┘                 │
 *         │   │   ┌─────────────────────────────────────┘
 *         │   │   │
 *         │   │   │   ┌─────────────────────────────────┐
 *         │   │   │   │ nd-xcv9NFBilDvWKyYG            │
 *         │   │   │   │ "Template for commenting..."   │
 *         │   │   │   │ (Variable) - SHARED             │
 *         │   │   │   └───────┬─────────────────────────┘
 *         │   │   │           │ text
 *         ▼   ▼   ▼           ▼
 *     ┌─────────────────────────────────┐
 *     │ nd-tvQwRmbPhKA69OgT             │
 *     │ "Create a Comment for PR"       │
 *     │ (TextGen)                       │
 *     └─────────────┬───────────────────┘
 *                   │ generated-text
 *                   ▼
 *     ┌─────────────────────────────────┐
 *     │ nd-le8wUlKPyfeueTTP             │◄─── number (from trigger)
 *     │ "Create Pull Request Comment"   │
 *     │ (GitHub Action)                 │
 *     └─────────────────────────────────┘
 *
 *
 * SHARED TEMPLATES:
 * ┌─────────────────────────────────┐     ┌─────────────────────────────────┐
 * │ nd-0gHqrsQ63D3oD6H9             │     │ nd-SP2PD7natQF8f2yH             │
 * │ "Template - Manual QA"          │────▶│ "Template - Prompt for AI..."   │
 * │ (Variable)                      │     │ (Variable)                      │
 * └─────────────────────────────────┘     └─────────────────────────────────┘
 *           │                                       │
 *           ▼                                       ▼
 *    Both Manual QA nodes                   Both Prompt nodes
 *    use this template                      use this template
 *
 * Key Points:
 * - Two independent GitHub triggers handle different PR events
 * - Each trigger flows through parallel QA processing (Manual + AI Agents)
 * - Both flows converge on creating PR comments via GitHub Actions
 * - Template variables are shared between both flows for consistency
 * - Flow 1: Ready for Review → processes 3 trigger outputs → creates comment
 * - Flow 2: PR Opened → processes 4 trigger outputs → creates comment
 */
export const twoTriggerFixture = {
	id: "wrks-v1mMsUkpKvxzltN8",
	name: "QA Testing Agents - gh/giselles-ai/giselle",
	schemaVersion: "20250221",
	nodes: [
		{
			id: "nd-5JoATar9nEGbObfu",
			name: "On Pull Request Ready for Review",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-0mRTXvyJ7RnOKpZV",
					label: "title",
					accessor: "title",
				},
				{
					id: "otp-jiHgYn9q5gN1fqPl",
					label: "body",
					accessor: "body",
				},
				{
					id: "otp-2ohls1XMK00VNGu4",
					label: "number",
					accessor: "number",
				},
				{
					id: "otp-OG1pZlpituqphNwj",
					label: "diff",
					accessor: "diff",
				},
				{
					id: "otp-GPsIqQRCGFF3uWHG",
					label: "pullRequestUrl",
					accessor: "pullRequestUrl",
				},
			],
			content: {
				type: "trigger",
				provider: "github",
				state: {
					status: "configured",
					flowTriggerId: "fltg-v4EMfG0A4aj4X9bO",
				},
			},
		},
		{
			id: "nd-Dd7brCDUvMmBK9De",
			name: "Create Pull Request Comment",
			type: "operation",
			inputs: [
				{
					id: "inp-Z4RmEr05QmmLR8Cr",
					label: "pullNumber",
					accessor: "pullNumber",
					isRequired: true,
				},
				{
					id: "inp-tfnyvnAY1XEKk0G7",
					label: "body",
					accessor: "body",
					isRequired: true,
				},
			],
			outputs: [
				{
					id: "otp-kLODmMvGlJVUj7Si",
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
						commandId: "github.create.pullRequestComment",
						installationId: 63943825,
						repositoryNodeId: "R_kgDOMmKFmQ",
					},
				},
			},
		},
		{
			id: "nd-ySQi0YbUMoNsELO3",
			name: "Manual QA",
			type: "operation",
			inputs: [
				{
					id: "inp-DrnEb6teautNVkRp",
					label: "Input",
					accessor: "inp-DrnEb6teautNVkRp",
				},
				{
					id: "inp-fbaC3bTBigzi8ZJW",
					label: "Input",
					accessor: "inp-fbaC3bTBigzi8ZJW",
				},
				{
					id: "inp-Vvaq3OqUYVx1wcmd",
					label: "Input",
					accessor: "inp-Vvaq3OqUYVx1wcmd",
				},
				{
					id: "inp-Cs7JWITBYz7sP5yy",
					label: "Input",
					accessor: "inp-Cs7JWITBYz7sP5yy",
				},
			],
			outputs: [
				{
					id: "otp-qysC38n7VeRNiJKS",
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
				prompt: "id: nd-ySQi0YbUMoNsELO3, name: Manual QA",
			},
		},
		{
			id: "nd-xcv9NFBilDvWKyYG",
			name: "Template for commenting on pull requests",
			type: "variable",
			inputs: [],
			outputs: [
				{
					id: "otp-K01XlRLapePtTpm4",
					label: "Output",
					accessor: "text",
				},
			],
			content: {
				type: "text",
				text: "id: nd-xcv9NFBilDvWKyYG, name: Template for commenting on pull requests",
			},
		},
		{
			id: "nd-0RVsikMQqKwRMWuZ",
			name: "Prompt for AI Agents",
			type: "operation",
			inputs: [
				{
					id: "inp-PAqOhVOuyU8kFx42",
					label: "Input",
					accessor: "inp-DrnEb6teautNVkRp",
				},
				{
					id: "inp-aWfv30IDbHUaMQM7",
					label: "Input",
					accessor: "inp-fbaC3bTBigzi8ZJW",
				},
				{
					id: "inp-JVywfK3heyK2G12A",
					label: "Input",
					accessor: "inp-Vvaq3OqUYVx1wcmd",
				},
				{
					id: "inp-ca77WniPNUUsV6Uo",
					label: "Input",
					accessor: "inp-ca77WniPNUUsV6Uo",
				},
			],
			outputs: [
				{
					id: "otp-gzHyQqHxVZidjFfE",
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
				prompt: "id: nd-0RVsikMQqKwRMWuZ, name: Prompt for AI Agents",
			},
		},
		{
			id: "nd-FoP9shtlUFMU5zcI",
			name: "On Pull Request Opened",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-EKzpvhrPxGCtl3Mq",
					label: "title",
					accessor: "title",
				},
				{
					id: "otp-cWI61TwrGMmd0WDZ",
					label: "body",
					accessor: "body",
				},
				{
					id: "otp-XcsSTfYlZ3eVVpFA",
					label: "number",
					accessor: "number",
				},
				{
					id: "otp-OVUklkKibvxFxj7S",
					label: "diff",
					accessor: "diff",
				},
				{
					id: "otp-MaArQMOUjV7N0BtG",
					label: "pullRequestUrl",
					accessor: "pullRequestUrl",
				},
			],
			content: {
				type: "trigger",
				provider: "github",
				state: {
					status: "configured",
					flowTriggerId: "fltg-9zegFs0qQ28q59mo",
				},
			},
		},
		{
			id: "nd-worigWCbqYT9Ofye",
			name: "Create a Comment for PR",
			type: "operation",
			inputs: [
				{
					id: "inp-MRdPedMLO8RKvBWi",
					label: "Input",
					accessor: "inp-MRdPedMLO8RKvBWi",
				},
				{
					id: "inp-PZ6UWxt51956pZBg",
					label: "Input",
					accessor: "inp-PZ6UWxt51956pZBg",
				},
				{
					id: "inp-JFq5Cg5ay1qAZFGQ",
					label: "Input",
					accessor: "inp-JFq5Cg5ay1qAZFGQ",
				},
			],
			outputs: [
				{
					id: "otp-6SqSucPqpjapgOk2",
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
				prompt: "id: nd-worigWCbqYT9Ofye, name: Create a Comment for PR",
			},
		},
		{
			id: "nd-0gHqrsQ63D3oD6H9",
			name: "Template - Manual QA",
			type: "variable",
			inputs: [],
			outputs: [
				{
					id: "otp-vPI9IFnb3ZBiQnBj",
					label: "Output",
					accessor: "text",
				},
			],
			content: {
				type: "text",
				text: "id: nd-0gHqrsQ63D3oD6H9, name: Template - Manual QA",
			},
		},
		{
			id: "nd-ZEMYDrI7lolEeMEJ",
			name: "Manual QA",
			type: "operation",
			inputs: [
				{
					id: "inp-YWXbkEGjAUl3atIj",
					label: "Input",
					accessor: "inp-Cs7JWITBYz7sP5yy",
				},
				{
					id: "inp-FLUad3yvRMJgTehf",
					label: "Input",
					accessor: "inp-FLUad3yvRMJgTehf",
				},
				{
					id: "inp-IJbhBKKLzRNtI7H6",
					label: "Input",
					accessor: "inp-IJbhBKKLzRNtI7H6",
				},
				{
					id: "inp-sMlrWRLUqIPQKXFG",
					label: "Input",
					accessor: "inp-sMlrWRLUqIPQKXFG",
				},
				{
					id: "inp-wC2KKY63t9TCgg5u",
					label: "Input",
					accessor: "inp-wC2KKY63t9TCgg5u",
				},
			],
			outputs: [
				{
					id: "otp-4VCZvo4XGxw8AC2T",
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
				prompt: "id: nd-ZEMYDrI7lolEeMEJ, name: Manual QA",
			},
		},
		{
			id: "nd-SP2PD7natQF8f2yH",
			name: "Template - Prompt for AI Agents",
			type: "variable",
			inputs: [],
			outputs: [
				{
					id: "otp-QfCOVp6R39Bkbgsl",
					label: "Output",
					accessor: "text",
				},
			],
			content: {
				type: "text",
				text: "id: nd-SP2PD7natQF8f2yH, name: Template - Prompt for AI Agents",
			},
		},
		{
			id: "nd-pLEJoQT8VDAJ1Ewx",
			name: "Prompt for AI Agents",
			type: "operation",
			inputs: [
				{
					id: "inp-wfm1bB7GXioXZJg0",
					label: "Input",
					accessor: "inp-wfm1bB7GXioXZJg0",
				},
				{
					id: "inp-2s9YRirW7jpMIC2J",
					label: "Input",
					accessor: "inp-2s9YRirW7jpMIC2J",
				},
				{
					id: "inp-prJWznXn9UXXT5p7",
					label: "Input",
					accessor: "inp-prJWznXn9UXXT5p7",
				},
				{
					id: "inp-D2ZIq7Vp5YeDvN0O",
					label: "Input",
					accessor: "inp-D2ZIq7Vp5YeDvN0O",
				},
			],
			outputs: [
				{
					id: "otp-124Nmb9s7FaoLUhm",
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
				prompt: "id: nd-pLEJoQT8VDAJ1Ewx, name: Prompt for AI Agents",
			},
		},
		{
			id: "nd-tvQwRmbPhKA69OgT",
			name: "Create a Comment for PR",
			type: "operation",
			inputs: [
				{
					id: "inp-bbKj8k5M6rYE1uJg",
					label: "Input",
					accessor: "inp-bbKj8k5M6rYE1uJg",
				},
				{
					id: "inp-Z3MQhzptOvgUfSre",
					label: "Input",
					accessor: "inp-Z3MQhzptOvgUfSre",
				},
				{
					id: "inp-7E43oOHljM5dheMb",
					label: "Input",
					accessor: "inp-7E43oOHljM5dheMb",
				},
			],
			outputs: [
				{
					id: "otp-Ymo0M11MD5dkPn6e",
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
				prompt: "id: nd-tvQwRmbPhKA69OgT, name: Create a Comment for PR",
			},
		},
		{
			id: "nd-le8wUlKPyfeueTTP",
			name: "Create Pull Request Comment",
			type: "operation",
			inputs: [
				{
					id: "inp-FjvXv0PTwpSXHbsw",
					label: "pullNumber",
					accessor: "pullNumber",
					isRequired: true,
				},
				{
					id: "inp-myH2Nm8uNIU2AkKx",
					label: "body",
					accessor: "body",
					isRequired: true,
				},
			],
			outputs: [
				{
					id: "otp-L60VkJLvoO8MnpBi",
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
						commandId: "github.create.pullRequestComment",
						installationId: 63943825,
						repositoryNodeId: "R_kgDOMmKFmQ",
					},
				},
			},
		},
	],
	connections: [
		{
			id: "cnnc-XULWablFttMKicPM",
			outputNode: {
				id: "nd-5JoATar9nEGbObfu",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-2ohls1XMK00VNGu4",
			inputNode: {
				id: "nd-Dd7brCDUvMmBK9De",
				type: "operation",
				content: {
					type: "action",
				},
			},
			inputId: "inp-Z4RmEr05QmmLR8Cr",
		},
		{
			id: "cnnc-tp4fdCcsnj4O8nSj",
			outputNode: {
				id: "nd-5JoATar9nEGbObfu",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-0mRTXvyJ7RnOKpZV",
			inputNode: {
				id: "nd-ySQi0YbUMoNsELO3",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-DrnEb6teautNVkRp",
		},
		{
			id: "cnnc-iE9bsUJLtAICvhxM",
			outputNode: {
				id: "nd-5JoATar9nEGbObfu",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-jiHgYn9q5gN1fqPl",
			inputNode: {
				id: "nd-ySQi0YbUMoNsELO3",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-fbaC3bTBigzi8ZJW",
		},
		{
			id: "cnnc-c3e21ISQlWEdAZXq",
			outputNode: {
				id: "nd-5JoATar9nEGbObfu",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-OG1pZlpituqphNwj",
			inputNode: {
				id: "nd-ySQi0YbUMoNsELO3",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-Vvaq3OqUYVx1wcmd",
		},
		{
			id: "cnnc-0ija2wk6GXrg8dYf",
			outputNode: {
				id: "nd-5JoATar9nEGbObfu",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-0mRTXvyJ7RnOKpZV",
			inputNode: {
				id: "nd-0RVsikMQqKwRMWuZ",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-PAqOhVOuyU8kFx42",
		},
		{
			id: "cnnc-2r5BIClgPXG84tXz",
			outputNode: {
				id: "nd-5JoATar9nEGbObfu",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-jiHgYn9q5gN1fqPl",
			inputNode: {
				id: "nd-0RVsikMQqKwRMWuZ",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-aWfv30IDbHUaMQM7",
		},
		{
			id: "cnnc-ZCE55N1OzHCvYWVM",
			outputNode: {
				id: "nd-5JoATar9nEGbObfu",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-OG1pZlpituqphNwj",
			inputNode: {
				id: "nd-0RVsikMQqKwRMWuZ",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-JVywfK3heyK2G12A",
		},
		{
			id: "cnnc-lJKXQ3Jpm1eqMCxN",
			outputNode: {
				id: "nd-xcv9NFBilDvWKyYG",
				type: "variable",
				content: {
					type: "text",
				},
			},
			outputId: "otp-K01XlRLapePtTpm4",
			inputNode: {
				id: "nd-worigWCbqYT9Ofye",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-MRdPedMLO8RKvBWi",
		},
		{
			id: "cnnc-4FTjNsLuAZPy022w",
			outputNode: {
				id: "nd-ySQi0YbUMoNsELO3",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			outputId: "otp-qysC38n7VeRNiJKS",
			inputNode: {
				id: "nd-worigWCbqYT9Ofye",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-PZ6UWxt51956pZBg",
		},
		{
			id: "cnnc-aw85F7ZSjrZ0IARb",
			outputNode: {
				id: "nd-0RVsikMQqKwRMWuZ",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			outputId: "otp-gzHyQqHxVZidjFfE",
			inputNode: {
				id: "nd-worigWCbqYT9Ofye",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-JFq5Cg5ay1qAZFGQ",
		},
		{
			id: "cnnc-FVGBRT7x3sVj2IVy",
			outputNode: {
				id: "nd-worigWCbqYT9Ofye",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			outputId: "otp-6SqSucPqpjapgOk2",
			inputNode: {
				id: "nd-Dd7brCDUvMmBK9De",
				type: "operation",
				content: {
					type: "action",
				},
			},
			inputId: "inp-tfnyvnAY1XEKk0G7",
		},
		{
			id: "cnnc-XvoNdJ9czKIEXhjp",
			outputNode: {
				id: "nd-0gHqrsQ63D3oD6H9",
				type: "variable",
				content: {
					type: "text",
				},
			},
			outputId: "otp-vPI9IFnb3ZBiQnBj",
			inputNode: {
				id: "nd-ySQi0YbUMoNsELO3",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-Cs7JWITBYz7sP5yy",
		},
		{
			id: "cnnc-0I4tbbZ9q1xbHl77",
			outputNode: {
				id: "nd-0gHqrsQ63D3oD6H9",
				type: "variable",
				content: {
					type: "text",
				},
			},
			outputId: "otp-vPI9IFnb3ZBiQnBj",
			inputNode: {
				id: "nd-ZEMYDrI7lolEeMEJ",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-YWXbkEGjAUl3atIj",
		},
		{
			id: "cnnc-PoESuO0NCdNDXRLa",
			outputNode: {
				id: "nd-FoP9shtlUFMU5zcI",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-EKzpvhrPxGCtl3Mq",
			inputNode: {
				id: "nd-ZEMYDrI7lolEeMEJ",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-FLUad3yvRMJgTehf",
		},
		{
			id: "cnnc-pghojE1LSSrLWBN4",
			outputNode: {
				id: "nd-FoP9shtlUFMU5zcI",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-cWI61TwrGMmd0WDZ",
			inputNode: {
				id: "nd-ZEMYDrI7lolEeMEJ",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-IJbhBKKLzRNtI7H6",
		},
		{
			id: "cnnc-Q7yxFPuNfes3SooL",
			outputNode: {
				id: "nd-FoP9shtlUFMU5zcI",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-OVUklkKibvxFxj7S",
			inputNode: {
				id: "nd-ZEMYDrI7lolEeMEJ",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-sMlrWRLUqIPQKXFG",
		},
		{
			id: "cnnc-54q8o5ghkFHRBsq1",
			outputNode: {
				id: "nd-FoP9shtlUFMU5zcI",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-MaArQMOUjV7N0BtG",
			inputNode: {
				id: "nd-ZEMYDrI7lolEeMEJ",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-wC2KKY63t9TCgg5u",
		},
		{
			id: "cnnc-QA5EtNUAPnO1jh1d",
			outputNode: {
				id: "nd-SP2PD7natQF8f2yH",
				type: "variable",
				content: {
					type: "text",
				},
			},
			outputId: "otp-QfCOVp6R39Bkbgsl",
			inputNode: {
				id: "nd-0RVsikMQqKwRMWuZ",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-ca77WniPNUUsV6Uo",
		},
		{
			id: "cnnc-fj7JqjEbDUXReeHH",
			outputNode: {
				id: "nd-SP2PD7natQF8f2yH",
				type: "variable",
				content: {
					type: "text",
				},
			},
			outputId: "otp-QfCOVp6R39Bkbgsl",
			inputNode: {
				id: "nd-pLEJoQT8VDAJ1Ewx",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-wfm1bB7GXioXZJg0",
		},
		{
			id: "cnnc-xG7dUsEsbSyBcB7J",
			outputNode: {
				id: "nd-FoP9shtlUFMU5zcI",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-EKzpvhrPxGCtl3Mq",
			inputNode: {
				id: "nd-pLEJoQT8VDAJ1Ewx",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-2s9YRirW7jpMIC2J",
		},
		{
			id: "cnnc-Kkv3aO5RMDWa42Fu",
			outputNode: {
				id: "nd-FoP9shtlUFMU5zcI",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-cWI61TwrGMmd0WDZ",
			inputNode: {
				id: "nd-pLEJoQT8VDAJ1Ewx",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-prJWznXn9UXXT5p7",
		},
		{
			id: "cnnc-DaILV1FNuKlVUfaZ",
			outputNode: {
				id: "nd-FoP9shtlUFMU5zcI",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-OVUklkKibvxFxj7S",
			inputNode: {
				id: "nd-pLEJoQT8VDAJ1Ewx",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-D2ZIq7Vp5YeDvN0O",
		},
		{
			id: "cnnc-Xh2YmFlB0EzMN7NW",
			outputNode: {
				id: "nd-xcv9NFBilDvWKyYG",
				type: "variable",
				content: {
					type: "text",
				},
			},
			outputId: "otp-K01XlRLapePtTpm4",
			inputNode: {
				id: "nd-tvQwRmbPhKA69OgT",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-bbKj8k5M6rYE1uJg",
		},
		{
			id: "cnnc-gH6BCfvsfjiSk4Hz",
			outputNode: {
				id: "nd-ZEMYDrI7lolEeMEJ",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			outputId: "otp-4VCZvo4XGxw8AC2T",
			inputNode: {
				id: "nd-tvQwRmbPhKA69OgT",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-Z3MQhzptOvgUfSre",
		},
		{
			id: "cnnc-SyQDKqDxgRXd5MEC",
			outputNode: {
				id: "nd-pLEJoQT8VDAJ1Ewx",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			outputId: "otp-124Nmb9s7FaoLUhm",
			inputNode: {
				id: "nd-tvQwRmbPhKA69OgT",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			inputId: "inp-7E43oOHljM5dheMb",
		},
		{
			id: "cnnc-gdpj7KitsaXvvcPg",
			outputNode: {
				id: "nd-tvQwRmbPhKA69OgT",
				type: "operation",
				content: {
					type: "textGeneration",
				},
			},
			outputId: "otp-Ymo0M11MD5dkPn6e",
			inputNode: {
				id: "nd-le8wUlKPyfeueTTP",
				type: "operation",
				content: {
					type: "action",
				},
			},
			inputId: "inp-myH2Nm8uNIU2AkKx",
		},
		{
			id: "cnnc-5HwEW7oxzuaE5FIO",
			outputNode: {
				id: "nd-FoP9shtlUFMU5zcI",
				type: "operation",
				content: {
					type: "trigger",
				},
			},
			outputId: "otp-XcsSTfYlZ3eVVpFA",
			inputNode: {
				id: "nd-le8wUlKPyfeueTTP",
				type: "operation",
				content: {
					type: "action",
				},
			},
			inputId: "inp-FjvXv0PTwpSXHbsw",
		},
	],
	ui: {
		nodeState: {},
		viewport: {
			x: 54.69344474670504,
			y: 239.6191011184605,
			zoom: 0.5173435218723061,
		},
		currentShortcutScope: "canvas" as const,
	},
} satisfies Workspace;
