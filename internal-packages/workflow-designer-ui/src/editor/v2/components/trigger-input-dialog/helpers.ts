import type { FlowTrigger, TriggerNode } from "@giselle-ai/data-type";
import {
	type GitHubTriggerEventId,
	getGitHubDisplayLabel,
	type githubTriggers,
} from "@giselle-ai/flow";
import type { z } from "zod/v4";

export function buttonLabel(node: TriggerNode) {
	switch (node.content.provider) {
		case "manual":
			return "Start Manual Flow";
		case "github":
			return "Test with Dummy Data";
		case "app-entry":
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

function createInput(args: {
	eventId: GitHubTriggerEventId;
	accessor: string;
	type: FormInput["type"];
	required?: boolean;
}): Omit<FormInput, "name"> {
	return {
		label: getGitHubDisplayLabel({
			eventId: args.eventId,
			accessor: args.accessor,
		}),
		type: args.type,
		required: args.required ?? true,
	};
}

const githubEventInputs: GithubEventInputMap = {
	"github.issue.created": {
		issueNumber: createInput({
			eventId: "github.issue.created",
			accessor: "issueNumber",
			type: "number",
		}),
		title: createInput({
			eventId: "github.issue.created",
			accessor: "title",
			type: "text",
		}),
		body: createInput({
			eventId: "github.issue.created",
			accessor: "body",
			type: "multiline-text",
			required: false,
		}),
	},
	"github.issue.closed": {
		issueNumber: createInput({
			eventId: "github.issue.closed",
			accessor: "issueNumber",
			type: "number",
		}),
		title: createInput({
			eventId: "github.issue.closed",
			accessor: "title",
			type: "text",
		}),
		body: createInput({
			eventId: "github.issue.closed",
			accessor: "body",
			type: "multiline-text",
			required: false,
		}),
	},
	"github.issue.labeled": {
		issueNumber: createInput({
			eventId: "github.issue.labeled",
			accessor: "issueNumber",
			type: "number",
		}),
		title: createInput({
			eventId: "github.issue.labeled",
			accessor: "title",
			type: "text",
		}),
		body: createInput({
			eventId: "github.issue.labeled",
			accessor: "body",
			type: "multiline-text",
			required: false,
		}),
		labelName: createInput({
			eventId: "github.issue.labeled",
			accessor: "labelName",
			type: "text",
		}),
	},
	"github.issue_comment.created": {
		issueNumber: createInput({
			eventId: "github.issue_comment.created",
			accessor: "issueNumber",
			type: "number",
		}),
		issueTitle: createInput({
			eventId: "github.issue_comment.created",
			accessor: "issueTitle",
			type: "text",
		}),
		issueBody: createInput({
			eventId: "github.issue_comment.created",
			accessor: "issueBody",
			type: "multiline-text",
		}),
		body: createInput({
			eventId: "github.issue_comment.created",
			accessor: "body",
			type: "multiline-text",
		}),
	},
	"github.pull_request_comment.created": {
		issueNumber: createInput({
			eventId: "github.pull_request_comment.created",
			accessor: "issueNumber",
			type: "number",
		}),
		issueTitle: createInput({
			eventId: "github.pull_request_comment.created",
			accessor: "issueTitle",
			type: "text",
		}),
		issueBody: createInput({
			eventId: "github.pull_request_comment.created",
			accessor: "issueBody",
			type: "multiline-text",
		}),
		body: createInput({
			eventId: "github.pull_request_comment.created",
			accessor: "body",
			type: "multiline-text",
		}),
		diff: createInput({
			eventId: "github.pull_request_comment.created",
			accessor: "diff",
			type: "multiline-text",
			required: false,
		}),
	},
	"github.pull_request.ready_for_review": {
		title: createInput({
			eventId: "github.pull_request.ready_for_review",
			accessor: "title",
			type: "text",
		}),
		body: createInput({
			eventId: "github.pull_request.ready_for_review",
			accessor: "body",
			type: "multiline-text",
			required: false,
		}),
		number: createInput({
			eventId: "github.pull_request.ready_for_review",
			accessor: "number",
			type: "number",
		}),
		diff: createInput({
			eventId: "github.pull_request.ready_for_review",
			accessor: "diff",
			type: "multiline-text",
			required: false,
		}),
		pullRequestUrl: createInput({
			eventId: "github.pull_request.ready_for_review",
			accessor: "pullRequestUrl",
			type: "text",
		}),
	},
	"github.pull_request.closed": {
		title: createInput({
			eventId: "github.pull_request.closed",
			accessor: "title",
			type: "text",
		}),
		body: createInput({
			eventId: "github.pull_request.closed",
			accessor: "body",
			type: "multiline-text",
			required: false,
		}),
		number: createInput({
			eventId: "github.pull_request.closed",
			accessor: "number",
			type: "number",
		}),
		diff: createInput({
			eventId: "github.pull_request.closed",
			accessor: "diff",
			type: "multiline-text",
			required: false,
		}),
		pullRequestUrl: createInput({
			eventId: "github.pull_request.closed",
			accessor: "pullRequestUrl",
			type: "text",
		}),
	},
	"github.pull_request.opened": {
		title: createInput({
			eventId: "github.pull_request.opened",
			accessor: "title",
			type: "text",
		}),
		body: createInput({
			eventId: "github.pull_request.opened",
			accessor: "body",
			type: "multiline-text",
			required: false,
		}),
		number: createInput({
			eventId: "github.pull_request.opened",
			accessor: "number",
			type: "number",
		}),
		diff: createInput({
			eventId: "github.pull_request.opened",
			accessor: "diff",
			type: "multiline-text",
			required: false,
		}),
		pullRequestUrl: createInput({
			eventId: "github.pull_request.opened",
			accessor: "pullRequestUrl",
			type: "text",
		}),
	},
	"github.pull_request_review_comment.created": {
		body: createInput({
			eventId: "github.pull_request_review_comment.created",
			accessor: "body",
			type: "multiline-text",
		}),
		pullRequestNumber: createInput({
			eventId: "github.pull_request_review_comment.created",
			accessor: "pullRequestNumber",
			type: "number",
		}),
		pullRequestTitle: createInput({
			eventId: "github.pull_request_review_comment.created",
			accessor: "pullRequestTitle",
			type: "text",
		}),
		pullRequestBody: createInput({
			eventId: "github.pull_request_review_comment.created",
			accessor: "pullRequestBody",
			type: "multiline-text",
			required: false,
		}),
		previousCommentBody: createInput({
			eventId: "github.pull_request_review_comment.created",
			accessor: "previousCommentBody",
			type: "multiline-text",
			required: false,
		}),
		diff: createInput({
			eventId: "github.pull_request_review_comment.created",
			accessor: "diff",
			type: "multiline-text",
		}),
		id: createInput({
			eventId: "github.pull_request_review_comment.created",
			accessor: "id",
			type: "number",
		}),
	},
	"github.pull_request.labeled": {
		pullRequestNumber: createInput({
			eventId: "github.pull_request.labeled",
			accessor: "pullRequestNumber",
			type: "number",
		}),
		pullRequestTitle: createInput({
			eventId: "github.pull_request.labeled",
			accessor: "pullRequestTitle",
			type: "text",
		}),
		pullRequestBody: createInput({
			eventId: "github.pull_request.labeled",
			accessor: "pullRequestBody",
			type: "multiline-text",
			required: false,
		}),
		labelName: createInput({
			eventId: "github.pull_request.labeled",
			accessor: "labelName",
			type: "text",
		}),
	},
	"github.discussion.created": {
		discussionNumber: createInput({
			eventId: "github.discussion.created",
			accessor: "discussionNumber",
			type: "number",
		}),
		discussionTitle: createInput({
			eventId: "github.discussion.created",
			accessor: "discussionTitle",
			type: "text",
		}),
		discussionBody: createInput({
			eventId: "github.discussion.created",
			accessor: "discussionBody",
			type: "multiline-text",
		}),
		discussionUrl: createInput({
			eventId: "github.discussion.created",
			accessor: "discussionUrl",
			type: "text",
		}),
		categoryName: createInput({
			eventId: "github.discussion.created",
			accessor: "categoryName",
			type: "text",
		}),
	},
	"github.discussion_comment.created": {
		discussionNumber: createInput({
			eventId: "github.discussion_comment.created",
			accessor: "discussionNumber",
			type: "number",
		}),
		discussionTitle: createInput({
			eventId: "github.discussion_comment.created",
			accessor: "discussionTitle",
			type: "text",
		}),
		discussionBody: createInput({
			eventId: "github.discussion_comment.created",
			accessor: "discussionBody",
			type: "multiline-text",
		}),
		discussionUrl: createInput({
			eventId: "github.discussion_comment.created",
			accessor: "discussionUrl",
			type: "text",
		}),
		body: createInput({
			eventId: "github.discussion_comment.created",
			accessor: "body",
			type: "multiline-text",
		}),
		commentId: createInput({
			eventId: "github.discussion_comment.created",
			accessor: "commentId",
			type: "number",
		}),
		parentCommentBody: createInput({
			eventId: "github.discussion_comment.created",
			accessor: "parentCommentBody",
			type: "multiline-text",
			required: false,
		}),
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
