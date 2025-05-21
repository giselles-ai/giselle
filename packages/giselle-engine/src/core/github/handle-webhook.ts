import {
	type OverrideNode,
	WorkspaceGitHubIntegrationNextActionIssueCommentCreate,
	WorkspaceGitHubIntegrationNextActionPullRequestCommentCreate,
	type WorkspaceGitHubIntegrationPayloadField,
	type WorkspaceGitHubIntegrationSetting,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import {
	type GitHubAuthConfig,
	addReaction as addReactionApi,
} from "@giselle-sdk/github-tool";
import { z } from "zod/v4";
import { WorkflowError } from "../error";
import { runFlow } from "../flows";
import { getFlowTrigger } from "../flows/utils";
import { getGitHubRepositoryIntegrationIndex } from "../integrations/utils";
import { runApi } from "../runs";
import type { GiselleEngineContext } from "../types";
import { getWorkspace } from "../workspaces/utils";
import {
	type GitHubEvent,
	GitHubEventType,
	determineGitHubEvent,
} from "./events";
import {
	type Command,
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
	addReactionToComment?: (
		owner: string,
		repo: string,
		commentId: number,
	) => Promise<void>;
	addReactionToIssue?: (
		owner: string,
		repo: string,
		issueId: number,
	) => Promise<void>;
	buildResultFooter?: (workspaceId: WorkspaceId) => Promise<string>;
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
	const gitHubEvent = determineGitHubEvent(
		args.github.event,
		args.github.payload,
	);
	if (!gitHubEvent) {
		console.log(`Unsupported event: ${JSON.stringify(args.github, null, 2)}`);
		return [];
	}

	const repository = getRepositoryInfo(gitHubEvent);
	const workspaceGitHubIntegrationRepositorySettings =
		await getWorkspaceGitHubIntegrationRepositorySettings({
			storage: args.context.storage,
			repositoryNodeId: repository.nodeId,
		});

	const command = parseCommandFromEvent(gitHubEvent);

	// await processV2({
	// 	context: args.context,
	// 	repositoryNodeId: repository.nodeId,
	// 	githubEvent: gitHubEvent,
	// });

	const results = await processMatchedIntegrationSettingsDeprecated(
		gitHubEvent,
		args,
		repository,
		command,
		workspaceGitHubIntegrationRepositorySettings,
	);
	return results;
}

// Move to v2
async function processV2(args: {
	context: GiselleEngineContext;
	repositoryNodeId: string;
	githubEvent: GitHubEvent;
	options?: HandleGitHubWebhookOptions;
}) {
	const githubRepositoryIntegration = await getGitHubRepositoryIntegrationIndex(
		{
			storage: args.context.storage,
			repositoryNodeId: args.repositoryNodeId,
		},
	);
	if (githubRepositoryIntegration === undefined) {
		return;
	}

	await Promise.all(
		githubRepositoryIntegration.flowTriggerIds.map(async (flowTriggerId) => {
			const trigger = await getFlowTrigger({
				storage: args.context.storage,
				flowTriggerId,
			});
			await runRepositoryTrigger({
				context: args.context,
				trigger,
				githubEvent: args.githubEvent,
				repositoryNodeId: args.repositoryNodeId,
			});
		}),
	);
}

async function runRepositoryTrigger(args: {
	context: GiselleEngineContext;
	trigger: Awaited<ReturnType<typeof getFlowTrigger>>;
	githubEvent: GitHubEvent;
	repositoryNodeId: string;
}) {
	if (
		!args.trigger.enable ||
		args.trigger.configuration.provider !== "github"
	) {
		return;
	}
	if (args.trigger.configuration.repositoryNodeId !== args.repositoryNodeId) {
		return;
	}

	await Promise.all([
		addReaction(args),
		runFlow({
			context: args.context,
			triggerId: args.trigger.id,
		}),
	]);
}

async function addReaction(args: {
	githubEvent: GitHubEvent;
	context: GiselleEngineContext;
}) {
	const githubAuthV2 = args.context.integrationConfigs?.github?.authV2;
	if (githubAuthV2 === undefined) {
		throw new Error("GitHub authV2 configuration is missing");
	}
	if (args.githubEvent.payload.installation?.id === undefined) {
		throw new Error("GitHub installation ID is missing");
	}
	const authConfig = {
		strategy: "app-installation",
		appId: githubAuthV2.appId,
		privateKey: githubAuthV2.privateKey,
		installationId: args.githubEvent.payload.installation.id,
	} satisfies GitHubAuthConfig;

	switch (args.githubEvent.event) {
		case "issue_comment":
			await addReactionApi({
				id: args.githubEvent.payload.comment.node_id,
				content: "EYES",
				authConfig,
			});
			break;
		case "issues":
			await addReactionApi({
				id: args.githubEvent.payload.issue.node_id,
				content: "EYES",
				authConfig,
			});
			break;
		case "pull_request":
			await addReactionApi({
				id: args.githubEvent.payload.pull_request.node_id,
				content: "EYES",
				authConfig,
			});
			break;
		default: {
			const _exhaustiveCheck: never = args.githubEvent;
			throw new Error(`Unhandled event: ${_exhaustiveCheck}`);
		}
	}
}

// Extracted for legacy parallel execution.
// @deprecated This function will be removed in the future. Please use the new webhook processing method.
async function processMatchedIntegrationSettingsDeprecated(
	gitHubEvent: GitHubEvent,
	args: HandleGitHubWebhookArgs,
	repository: { owner: string; name: string; nodeId: string },
	command: Command | null,
	workspaceGitHubIntegrationRepositorySettings:
		| WorkspaceGitHubIntegrationSetting[]
		| undefined,
): Promise<HandleGitHubWebhookResult[]> {
	const matchedIntegrationSettings =
		workspaceGitHubIntegrationRepositorySettings?.filter((setting) =>
			isMatchingIntegrationSetting(setting, gitHubEvent, command),
		) ?? [];

	const integrationPromises = matchedIntegrationSettings.map((setting) =>
		processIntegration(
			setting,
			gitHubEvent,
			command,
			repository,
			args.context,
			args.options,
		),
	);
	const results = await Promise.all(integrationPromises);
	return results.flat();
}

async function processIntegration(
	setting: WorkspaceGitHubIntegrationSetting,
	gitHubEvent: GitHubEvent,
	command: Command | null,
	repository: { owner: string; name: string; nodeId: string },
	context: GiselleEngineContext,
	options?: HandleGitHubWebhookOptions,
): Promise<HandleGitHubWebhookResult[]> {
	await handleReaction(gitHubEvent, options);

	const overrideNodes: OverrideNode[] = [];
	const workspace = await getWorkspace({
		storage: context.storage,
		workspaceId: setting.workspaceId,
	});
	for (const payloadMap of setting.payloadMaps) {
		const node = workspace.nodes.find((node) => node.id === payloadMap.nodeId);
		if (node === undefined) {
			continue;
		}
		const payloadValue = await getPayloadValue(
			gitHubEvent,
			payloadMap.payload,
			command?.content,
			options?.pullRequestDiff,
		);
		switch (node.content.type) {
			case "textGeneration":
				overrideNodes.push({
					id: node.id,
					type: "operation",
					content: {
						type: node.content.type,
						prompt: `${payloadValue}`,
					},
				});
				break;
			case "imageGeneration":
				overrideNodes.push({
					id: node.id,
					type: "operation",
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
			case "trigger":
			case "action":
			case "vectorStore":
			case "query":
				break;
			default: {
				const _exhaustiveCheck: never = node.content;
				throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
			}
		}
	}
	const workflows = workspace.editingWorkflows.filter((workflow) =>
		workflow.jobs.some((job) =>
			job.operations.some((operation) =>
				overrideNodes.some(
					(overrideNode) =>
						overrideNode.id === operation.node.id ||
						operation.generationTemplate.sourceNodes.some(
							(sourceNode) => sourceNode.id === overrideNode.id,
						),
				),
			),
		),
	);
	const resultFooter = await options?.buildResultFooter?.(workspace.id);
	const results = await Promise.all(
		workflows.map((workflow) =>
			runApi({
				context,
				workspaceId: workspace.id,
				workflowId: workflow.id,
				overrideNodes,
			})
				.then((result) => {
					return result.map((jobResult) => {
						if (resultFooter != null && resultFooter.length > 0) {
							return `${jobResult}\n\n${resultFooter}`;
						}
						return jobResult;
					});
				})
				.catch((error: unknown) => {
					throw new WorkflowError(
						`Failed to run workflow: ${error}`,
						workspace.id,
						workflow.id,
						{ cause: error },
					);
				}),
		),
	);

	const webhookResults: HandleGitHubWebhookResult[] = [];
	for (const result of results) {
		for (const resultText of result) {
			switch (setting.nextAction) {
				case "github.pull_request_comment.create": {
					webhookResults.push({
						action: "github.pull_request_comment.create",
						pullRequest: {
							repo: {
								owner: repository.owner,
								name: repository.name,
							},
							// Some GitHub events treat pull requests as issues.
							number:
								"issue" in gitHubEvent.payload
									? gitHubEvent.payload.issue.number
									: gitHubEvent.payload.pull_request.number,
						},
						content: resultText,
					});
					break;
				}
				case "github.issue_comment.create": {
					webhookResults.push({
						action: "github.issue_comment.create",
						issue: {
							repo: {
								owner: repository.owner,
								name: repository.name,
							},
							// Some GitHub events treat pull requests as issues.
							number:
								"issue" in gitHubEvent.payload
									? gitHubEvent.payload.issue.number
									: gitHubEvent.payload.pull_request.number,
						},
						content: resultText,
					});
					break;
				}
				default: {
					const _exhaustiveCheck: never = setting.nextAction;
					throw new Error(`Unhandled action type: ${_exhaustiveCheck}`);
				}
			}
		}
	}
	return webhookResults;
}

export function isMatchingIntegrationSetting(
	setting: WorkspaceGitHubIntegrationSetting,
	event: GitHubEvent,
	command: Command | null,
): boolean {
	switch (setting.event) {
		case "github.issue_comment.created":
		case "github.pull_request_comment.created":
			return (
				event.type === GitHubEventType.ISSUE_COMMENT_CREATED &&
				setting.callsign !== null &&
				setting.callsign === command?.callsign
			);
		case "github.issues.opened":
			return event.type === GitHubEventType.ISSUES_OPENED;
		case "github.issues.closed":
			return event.type === GitHubEventType.ISSUES_CLOSED;
		case "github.pull_request.opened":
			return event.type === GitHubEventType.PULL_REQUEST_OPENED;
		case "github.pull_request.ready_for_review":
			return event.type === GitHubEventType.PULL_REQUEST_READY_FOR_REVIEW;
		case "github.pull_request.closed":
			return event.type === GitHubEventType.PULL_REQUEST_CLOSED;
		default: {
			const _exhaustiveCheck: never = setting.event;
			throw new Error(`Unhandled setting event type: ${_exhaustiveCheck}`);
		}
	}
}

async function handleReaction(
	event: GitHubEvent,
	options?: HandleGitHubWebhookOptions,
) {
	switch (event.type) {
		case GitHubEventType.ISSUE_COMMENT_CREATED:
			await options?.addReactionToComment?.(
				event.payload.repository.owner.login,
				event.payload.repository.name,
				event.payload.comment.id,
			);
			break;
		case GitHubEventType.ISSUES_OPENED:
		case GitHubEventType.ISSUES_CLOSED:
			if (options?.addReactionToIssue) {
				await options.addReactionToIssue(
					event.payload.repository.owner.login,
					event.payload.repository.name,
					event.payload.issue.number,
				);
			}
			break;
		case GitHubEventType.PULL_REQUEST_OPENED:
		case GitHubEventType.PULL_REQUEST_READY_FOR_REVIEW:
		case GitHubEventType.PULL_REQUEST_CLOSED:
			if (options?.addReactionToIssue) {
				await options.addReactionToIssue(
					event.payload.repository.owner.login,
					event.payload.repository.name,
					event.payload.pull_request.number,
				);
			}
			break;
		default: {
			const _exhaustiveCheck: never = event;
			throw new Error(`Unhandled event type for reaction: ${_exhaustiveCheck}`);
		}
	}
}

async function getPayloadValue(
	event: GitHubEvent,
	field: WorkspaceGitHubIntegrationPayloadField,
	command?: string,
	diff?: PullRequestDiffFn,
): Promise<string | number> {
	switch (event.type) {
		case GitHubEventType.ISSUE_COMMENT_CREATED:
			switch (field) {
				case "github.pull_request_comment.pull_request.title":
				case "github.issue_comment.issue.title":
					return event.payload.issue.title;
				case "github.pull_request_comment.pull_request.diff": {
					if (event.payload.issue.pull_request == null) {
						throw new Error(
							"Attempted to get diff for non-pull-request issue comment",
						);
					}
					const diffResult = await diff?.(
						event.payload.repository.owner.login,
						event.payload.repository.name,
						event.payload.issue.number,
					);
					return diffResult ?? "";
				}
				case "github.pull_request_comment.pull_request.body":
				case "github.issue_comment.issue.body":
					return event.payload.issue.body ?? "";
				case "github.issue_comment.body":
				case "github.pull_request_comment.body":
					return command ?? "";
				case "github.issue_comment.issue.number":
				case "github.pull_request_comment.pull_request.number":
					return event.payload.issue.number;
				case "github.issue_comment.issue.repository.owner":
				case "github.pull_request_comment.pull_request.repository.owner":
					return event.payload.repository.owner.login;
				case "github.pull_request_comment.pull_request.repository.name":
				case "github.issue_comment.issue.repository.name":
					return event.payload.repository.name;
				default: {
					throw new Error(
						`Unhandled field type: ${field} for event ${event.type}`,
					);
				}
			}

		case GitHubEventType.ISSUES_OPENED:
		case GitHubEventType.ISSUES_CLOSED:
			switch (field) {
				case "github.issues.title":
					return event.payload.issue.title;
				case "github.issues.body":
					return event.payload.issue.body ?? "";
				default: {
					throw new Error(
						`Unhandled field type: ${field} for event ${event.type}`,
					);
				}
			}

		case GitHubEventType.PULL_REQUEST_OPENED:
		case GitHubEventType.PULL_REQUEST_READY_FOR_REVIEW:
		case GitHubEventType.PULL_REQUEST_CLOSED:
			switch (field) {
				case "github.pull_request.title":
					return event.payload.pull_request.title;
				case "github.pull_request.body":
					return event.payload.pull_request.body ?? "";
				case "github.pull_request.diff": {
					const diffResult = await diff?.(
						event.payload.repository.owner.login,
						event.payload.repository.name,
						event.payload.pull_request.number,
					);
					return diffResult ?? "";
				}
				default: {
					throw new Error(
						`Unhandled field type: ${field} for event ${event.type}`,
					);
				}
			}

		default: {
			const _exhaustiveCheckEvent: never = event;
			throw new Error(`Unhandled event type: ${_exhaustiveCheckEvent}`);
		}
	}
}

function getRepositoryInfo(event: GitHubEvent) {
	return {
		owner: event.payload.repository.owner.login,
		name: event.payload.repository.name,
		nodeId: event.payload.repository.node_id,
	};
}

function parseCommandFromEvent(event: GitHubEvent): Command | null {
	if (event.type !== GitHubEventType.ISSUE_COMMENT_CREATED) {
		return null;
	}
	return parseCommandInternal(event.payload.comment.body);
}
