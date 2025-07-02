import type {
	FlowTrigger,
	Generation,
	ParameterItem,
	TriggerNode,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import type { githubTriggers } from "@giselle-sdk/flow";
import type { useGenerationRunnerSystem } from "@giselle-sdk/giselle-engine/react";
import type { buildWorkflowFromNode } from "@giselle-sdk/workflow-utils";
import type { z } from "zod";

export function buttonLabel(node: TriggerNode) {
	switch (node.content.provider) {
		case "manual":
			return "Start Manual Flow";
		case "github":
			return "Test with Dummy Data";
		default: {
			const _exhaustiveCheck: never = node.content.provider;
			throw new Error(`Unhandled trigger provider type: ${_exhaustiveCheck}`);
		}
	}
}

export interface FormInput {
	name: string;
	label: string;
	type: "text" | "multiline-text" | "number";
	required: boolean;
}

type GithubEventInputMap = {
	[K in keyof typeof githubTriggers]: {
		[K2 in keyof z.infer<
			(typeof githubTriggers)[K]["event"]["payloads"]
		>]: Omit<FormInput, "name">;
	};
};

export const githubEventInputs: GithubEventInputMap = {
	"github.issue.created": {
		issueNumber: { label: "Issue Number", type: "number", required: true },
		title: { label: "Title", type: "text", required: true },
		body: { label: "Body", type: "multiline-text", required: false },
	},
	"github.issue.closed": {
		issueNumber: { label: "Issue Number", type: "number", required: true },
		title: { label: "Title", type: "text", required: true },
		body: { label: "Body", type: "multiline-text", required: false },
	},
	"github.issue_comment.created": {
		issueNumber: { label: "Issue Number", type: "number", required: true },
		issueTitle: { label: "Issue Title", type: "text", required: true },
		issueBody: { label: "Issue Body", type: "multiline-text", required: true },
		body: { label: "Issue Comment", type: "multiline-text", required: true },
	},
	"github.pull_request_comment.created": {
		issueNumber: {
			label: "Pull Request Number",
			type: "number",
			required: true,
		},
		issueTitle: { label: "Pull Request Title", type: "text", required: true },
		issueBody: {
			label: "Pull Request Body",
			type: "multiline-text",
			required: true,
		},
		body: {
			label: "Pull Request Comment",
			type: "multiline-text",
			required: true,
		},
		diff: {
			label: "diff",
			type: "multiline-text",
			required: false,
		},
	},
	"github.pull_request.ready_for_review": {
		title: { label: "Title", type: "text", required: true },
		body: { label: "Body", type: "multiline-text", required: false },
		number: { label: "Number", type: "number", required: true },
		diff: { label: "diff", type: "multiline-text", required: false },
		pullRequestUrl: { label: "Pull request URL", type: "text", required: true },
	},
	"github.pull_request.closed": {
		title: { label: "Title", type: "text", required: true },
		body: { label: "Body", type: "multiline-text", required: false },
		number: { label: "Number", type: "number", required: true },
		pullRequestUrl: { label: "Pull request URL", type: "text", required: true },
	},
	"github.pull_request.opened": {
		title: { label: "Title", type: "text", required: true },
		body: { label: "Body", type: "multiline-text", required: false },
		number: { label: "Number", type: "number", required: true },
		diff: { label: "diff", type: "multiline-text", required: false },
		pullRequestUrl: { label: "Pull request URL", type: "text", required: true },
	},
	"github.pull_request_review_comment.created": {
		body: { label: "Body", type: "multiline-text", required: true },
		pullRequestNumber: { label: "Number", type: "number", required: true },
		pullRequestTitle: { label: "Title", type: "text", required: true },
		pullRequestBody: { label: "Body", type: "multiline-text", required: false },
		previousCommentBody: {
			label: "Previous comment body",
			type: "multiline-text",
			required: false,
		},
		diff: { label: "diff", type: "multiline-text", required: true },
		id: { label: "ID", type: "number", required: true },
	},
};

export function createInputsFromTrigger(
	trigger: FlowTrigger | undefined,
): FormInput[] {
	if (trigger === undefined) {
		return [];
	}

	switch (trigger.configuration.provider) {
		case "github": {
			const inputDefs = githubEventInputs[trigger.configuration.event.id];
			return Object.entries(inputDefs).map(([name, def]) => ({
				name,
				label: def.label,
				type: def.type,
				required: def.required,
			}));
		}
		case "manual": {
			return trigger.configuration.event.parameters.map((parameter) => ({
				name: parameter.id,
				label: parameter.name,
				type: parameter.type,
				required: parameter.required,
			}));
		}
		default: {
			const _exhaustiveCheck: never = trigger.configuration;
			throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
		}
	}
}

export function parseFormInputs(inputs: FormInput[], formData: FormData) {
	const errors: Record<string, string> = {};
	const values: Record<string, string | number> = {};

	for (const input of inputs) {
		const formDataEntryValue = formData.get(input.name);
		const value = formDataEntryValue
			? formDataEntryValue.toString().trim()
			: "";

		if (input.required && value === "") {
			errors[input.name] = `${input.label} is required`;
			continue;
		}

		if (value === "") {
			values[input.name] = "";
			continue;
		}

		switch (input.type) {
			case "text":
			case "multiline-text":
				values[input.name] = value;
				break;
			case "number": {
				const numValue = Number(value);
				if (Number.isNaN(numValue)) {
					errors[input.name] = `${input.label} must be a valid number`;
				} else {
					values[input.name] = numValue;
				}
				break;
			}
			default: {
				const _exhaustiveCheck: never = input.type;
				throw new Error(`Unhandled input type: ${_exhaustiveCheck}`);
			}
		}
	}

	return { errors, values };
}

export function toParameterItems(
	inputs: FormInput[],
	values: Record<string, string | number>,
): ParameterItem[] {
	const items: ParameterItem[] = [];
	for (const input of inputs) {
		const value = values[input.name];
		if (value === undefined || value === "") {
			continue;
		}
		switch (input.type) {
			case "text":
			case "multiline-text":
				items.push({
					type: "string",
					name: input.name,
					value: value as string,
				});
				break;
			case "number":
				items.push({
					type: "number",
					name: input.name,
					value: value as number,
				});
				break;
			default: {
				const _exhaustiveCheck: never = input.type;
				throw new Error(`Unhandled input type: ${_exhaustiveCheck}`);
			}
		}
	}
	return items;
}

export function createGenerationsForFlow(
	flow: NonNullable<ReturnType<typeof buildWorkflowFromNode>>,
	inputs: FormInput[],
	values: Record<string, string | number>,
	createGeneration: ReturnType<
		typeof useGenerationRunnerSystem
	>["createGeneration"],
	workspaceId: WorkspaceId,
) {
	const generations: Generation[] = [];
	for (const job of flow.jobs) {
		for (const operation of job.operations) {
			const parameterItems =
				operation.node.content.type === "trigger"
					? toParameterItems(inputs, values)
					: [];
			const generation = createGeneration({
				origin: { type: "workspace", id: workspaceId },
				inputs:
					parameterItems.length > 0
						? [{ type: "parameters", items: parameterItems }]
						: [],
				operationNode: operation.node,
				sourceNodes: operation.sourceNodes,
				connections: operation.connections,
			});
			generations.push(generation);
		}
	}
	return generations;
}
