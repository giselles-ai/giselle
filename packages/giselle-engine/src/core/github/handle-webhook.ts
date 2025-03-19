import {
	type OverrideNode,
	WorkspaceGitHubIntegrationNextActionIssueCommentCreate,
	WorkspaceGitHubIntegrationNextActionPullRequestCommentCreate,
	type WorkspaceGitHubIntegrationPayloadField,
} from "@giselle-sdk/data-type";
import type { IssueCommentCreatedEvent } from "@octokit/webhooks-types";
import { z } from "zod";
import { runApi } from "../runs";
import type { GiselleEngineContext } from "../types";
import { getWorkspace } from "../workspaces";
import {
	getWorkspaceGitHubIntegrationRepositorySettings,
	parseCommand as parseCommandInternal,
} from "./utils";

export const IssueCommentCreateAction = z.object({
	action: WorkspaceGitHubIntegrationNextActionIssueCommentCreate,
	issue: z.object({
		repo: z.object({
			owner: z.string(),
			name: z.string(),
		}),
		number: z.number(),
	}),
	content: z.string(),
});
type IssueCommentCreateAction = z.infer<typeof IssueCommentCreateAction>;
export const PullRequestCommentCreateAction = z.object({
	action: WorkspaceGitHubIntegrationNextActionPullRequestCommentCreate,
	pullRequest: z.object({
		repo: z.object({
			owner: z.string(),
			name: z.string(),
		}),
		number: z.number(),
	}),
	content: z.string(),
});
type PullRequestCommentCreateAction = z.infer<
	typeof PullRequestCommentCreateAction
>;
export const HandleGitHubWebhookResult = z.discriminatedUnion("action", [
	IssueCommentCreateAction,
	PullRequestCommentCreateAction,
]);
export type HandleGitHubWebhookResult = z.infer<
	typeof HandleGitHubWebhookResult
>;

type PullRequestDiffFn = (
	owner: string,
	repo: string,
	number: number,
) => Promise<string>;
export interface HandleGitHubWebhookOptions {
	pullRequestDiff?: PullRequestDiffFn;
	reaction?: (owner: string, repo: string, commentId: number) => Promise<void>;
}
export interface HandleGitHubWebhookArgs {
	github: {
		event: string;
		delivery: string;
		payload: unknown;
	};
	context: GiselleEngineContext;
	options?: HandleGitHubWebhookOptions;
}

export async function handleWebhook(args: HandleGitHubWebhookArgs) {
	const repository = getRepositoryOwnerNameNodeId(
		args.github.event,
		args.github.payload,
	);

	const command = parseCommand(args.github.event, args.github.payload);
	if (command === null) {
		return;
	}
	const workspaceGitHubIntegrationRepositorySettings =
		await getWorkspaceGitHubIntegrationRepositorySettings({
			storage: args.context.storage,
			repositoryNodeId: repository.nodeId,
		});
	return await Promise.all(
		(workspaceGitHubIntegrationRepositorySettings ?? [])
			.filter(
				(workspaceGitHubIntegrationSetting) =>
					workspaceGitHubIntegrationSetting.callsign === command?.callsign,
			)
			.map(async (workspaceGitHubIntegrationSetting) => {
				if (
					isIssueCommentCreatedEvent(args.github.payload, args.github.event)
				) {
					await args.options?.reaction?.(
						args.github.payload.repository.owner.login,
						args.github.payload.repository.name,
						args.github.payload.comment.id,
					);
				}
				const overrideNodes: OverrideNode[] = [];
				const workspace = await getWorkspace({
					context: args.context,
					workspaceId: workspaceGitHubIntegrationSetting.workspaceId,
				});
				for (const payloadMap of workspaceGitHubIntegrationSetting.payloadMaps) {
					const node = workspace.nodes.find(
						(node) => node.id === payloadMap.nodeId,
					);
					if (node === undefined) {
						continue;
					}
					const payloadValue = await getPayloadValue(
						args.github.event,
						args.github.payload,
						payloadMap.payload,
						command.content,
						args.options?.pullRequestDiff,
					);
					switch (node.content.type) {
						case "textGeneration":
							overrideNodes.push({
								id: node.id,
								type: "action",
								content: {
									type: node.content.type,
									prompt: `${payloadValue}`,
								},
							});
							break;
						case "imageGeneration":
							overrideNodes.push({
								id: node.id,
								type: "action",
								content: {
									type: node.content.type,
									prompt: `${payloadValue}`,
								},
							});
							break;
						case "file":
							throw new Error("File nodes are not supported");
						case "text":
							overrideNodes.push({
								id: node.id,
								type: "variable",
								content: {
									type: node.content.type,
									text: `${payloadValue}`,
								},
							});
							break;
						case "github":
							throw new Error("GitHub nodes are not supported");
						default: {
							const _exhaustiveCheck: never = node.content;
							throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
						}
					}
				}
				const workflows = workspace.editingWorkflows.filter((workflow) =>
					workflow.jobs.some((job) =>
						job.actions.some((action) =>
							overrideNodes.some(
								(overrideNode) =>
									overrideNode.id === action.node.id ||
									action.generationTemplate.sourceNodes.some(
										(sourceNode) => sourceNode.id === overrideNode.id,
									),
							),
						),
					),
				);
				const results = await Promise.all(
					workflows.map((workflow) =>
						runApi({
							context: args.context,
							workspaceId: workspace.id,
							workflowId: workflow.id,
							overrideNodes,
						}),
					),
				);
				switch (workspaceGitHubIntegrationSetting.nextAction) {
					case "github.pull_request_comment.create":
						return {
							action: "github.pull_request_comment.create",
							pullRequest: {
								repo: {
									owner: repository.owner,
									name: repository.name,
								},
								number: await getPayloadValue(
									args.github.event,
									args.github.payload,
									"github.pull_request_comment.pull_request.number",
								),
							},
							content: results.join("\n"),
						} satisfies PullRequestCommentCreateAction;
					case "github.issue_comment.create":
						return {
							action: "github.issue_comment.create",
							issue: {
								repo: {
									owner: repository.owner,
									name: repository.name,
								},
								number: await getPayloadValue(
									args.github.event,
									args.github.payload,
									"github.issue_comment.issue.number",
								),
							},
							content: results.join("\n"),
						} satisfies IssueCommentCreateAction;
					default: {
						const _exhaustiveCheck: never =
							workspaceGitHubIntegrationSetting.nextAction;
						throw new Error(`Unhandled action type: ${_exhaustiveCheck}`);
					}
				}
			}),
	);
}

function isIssueCommentCreatedEvent(
	payload: unknown,
	event: string,
): payload is IssueCommentCreatedEvent {
	return (
		event === "issue_comment" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "created"
	);
}

type PayloadValue<TField extends WorkspaceGitHubIntegrationPayloadField> =
	TField extends
		| "github.issue_comment.issue.number"
		| "github.pull_request_comment.pull_request.number"
		? number
		: string;

async function getPayloadValue<
	TField extends WorkspaceGitHubIntegrationPayloadField,
>(
	event: string,
	payload: unknown,
	field: TField,
	command?: string,
	diff?: PullRequestDiffFn,
): Promise<PayloadValue<TField>> {
	if (isIssueCommentCreatedEvent(payload, event)) {
		switch (field) {
			case "github.pull_request_comment.pull_request.title":
			case "github.issue_comment.issue.title":
				return payload.issue.title as PayloadValue<TField>;
			case "github.pull_request_comment.pull_request.diff":
				return ((await diff?.(
					payload.repository.owner.login,
					payload.repository.name,
					payload.issue.number,
				)) ?? "") as PayloadValue<TField>;
			case "github.pull_request_comment.pull_request.body":
			case "github.issue_comment.issue.body":
				return (payload.issue.body ?? "") as PayloadValue<TField>;
			case "github.issue_comment.body":
			case "github.pull_request_comment.body":
				return (command ?? "") as PayloadValue<TField>;
			case "github.issue_comment.issue.number":
			case "github.pull_request_comment.pull_request.number":
				return payload.issue.number as PayloadValue<TField>;
			case "github.issue_comment.issue.repository.owner":
			case "github.pull_request_comment.pull_request.repository.owner":
				return payload.repository.owner.login as PayloadValue<TField>;
			case "github.pull_request_comment.pull_request.repository.name":
			case "github.issue_comment.issue.repository.name":
				return payload.repository.name as PayloadValue<TField>;
			default: {
				const _exhaustiveCheck: never = field;
				throw new Error(`Unhandled field type: ${_exhaustiveCheck}`);
			}
		}
	}
	throw new Error(`Unhandled event type: ${event}`);
}

function getRepositoryNodeId(event: string, payload: unknown) {
	if (isIssueCommentCreatedEvent(payload, event)) {
		return payload.repository.node_id;
	}
	throw new Error(`Unhandled event type: ${event}`);
}
function getRepositoryOwnerNameNodeId(event: string, payload: unknown) {
	if (isIssueCommentCreatedEvent(payload, event)) {
		return {
			owner: payload.repository.owner.login,
			name: payload.repository.name,
			nodeId: payload.repository.node_id,
		};
	}
	throw new Error(`Unhandled event type: ${event}`);
}

function parseCommand(event: string, payload: unknown) {
	if (isIssueCommentCreatedEvent(payload, event)) {
		return parseCommandInternal(payload.comment.body);
	}
	throw new Error(`Unhandled event type: ${event}`);
}
