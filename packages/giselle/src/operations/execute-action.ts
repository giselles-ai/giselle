import {
	type GitHubActionId,
	githubActions,
} from "@giselles-ai/action-registry";
import {
	createDiscussionComment,
	createIssue,
	createIssueComment,
	createPullRequestComment,
	findDiscussionReplyTargetId,
	getDiscussion,
	getDiscussionForCommentCreation,
	getRepositoryFullname,
	replyPullRequestReviewComment,
	updatePullRequest,
} from "@giselles-ai/github-tool";
import {
	type GenerationContext,
	type GenerationOutput,
	type GitHubActionConfiguredState,
	isActionNode,
	isAppEntryNode,
	isTextNode,
	type NodeId,
	type OutputId,
	type QueuedGeneration,
} from "@giselles-ai/protocol";
import {
	isJsonContent,
	jsonContentToText,
} from "@giselles-ai/text-editor-utils";
import { useGenerationExecutor } from "../generations/internal/use-generation-executor";
import type { AppEntryResolver } from "../generations/types";
import type { GiselleContext } from "../types";

export function executeAction(args: {
	context: GiselleContext;
	generation: QueuedGeneration;
}) {
	return useGenerationExecutor({
		context: args.context,
		generation: args.generation,
		execute: async ({
			generationContext,
			generationContentResolver,
			appEntryResolver,
			finishGeneration,
		}) => {
			const operationNode = generationContext.operationNode;
			if (!isActionNode(operationNode)) {
				throw new Error("Invalid generation type");
			}
			const command = operationNode.content.command;
			if (command.state.status !== "configured") {
				throw new Error("Action is not configured");
			}
			let generationOutputs: GenerationOutput[] = [];
			switch (command.provider) {
				case "github":
					generationOutputs = await executeGitHubAction({
						state: command.state,
						context: args.context,
						generationContext,
						generationContentResolver,
						appEntryResolver,
					});
					break;
				default: {
					// TODO: Uncomment after implementing all action providers
					// const _exhaustiveCheck: never = command.provider;
					// throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
					const unknownProvider = (command as { provider: string }).provider;
					throw new Error(`Unhandled provider: ${unknownProvider}`);
				}
			}
			await finishGeneration({
				inputMessages: [],
				outputs: generationOutputs,
			});
		},
	});
}

async function resolveActionInputs(args: {
	state: GitHubActionConfiguredState;
	generationContext: GenerationContext;
	generationContentResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>;
	appEntryResolver: AppEntryResolver;
}): Promise<Record<string, string>> {
	const githubActionEntry = githubActions[args.state.commandId];
	if (githubActionEntry === undefined) {
		throw new Error(
			`GitHub action option not found for command ID: ${args.state.commandId}`,
		);
	}
	const inputs: Record<string, string> = {};
	const generationContext = args.generationContext;

	for (const payloadKey of githubActionEntry.payload.keyof().options) {
		const input = generationContext.operationNode.inputs.find(
			(input) => input.accessor === payloadKey,
		);
		const connection = generationContext.connections.find(
			(connection) => connection.inputId === input?.id,
		);
		const sourceNode = generationContext.sourceNodes.find(
			(sourceNode) => sourceNode.id === connection?.outputNode.id,
		);
		if (connection === undefined || sourceNode === undefined) {
			continue;
		}

		switch (sourceNode.type) {
			case "operation": {
				if (isAppEntryNode(sourceNode)) {
					const parts = await args.appEntryResolver(
						connection.outputNode.id,
						connection.outputId,
					);
					// Empty values are skipped; validation is delegated to Zod schema
					if (parts.length === 0) {
						break;
					}

					const textParts = parts.filter((p) => p.type === "text");
					if (textParts.length === 0) {
						throw new Error(
							`"${payloadKey}" requires a text value, but received non-text content (e.g., file or image)`,
						);
					}

					inputs[payloadKey] = textParts.map((p) => p.text).join(" ");
					break;
				}

				const content = await args.generationContentResolver(
					connection.outputNode.id,
					connection.outputId,
				);
				if (content === undefined) {
					continue;
				}
				inputs[payloadKey] = content;
				break;
			}
			case "variable":
				switch (sourceNode.content.type) {
					case "text": {
						if (!isTextNode(sourceNode)) {
							throw new Error(`Unexpected node data: ${sourceNode.id}`);
						}
						const jsonOrText = sourceNode.content.text;
						inputs[payloadKey] = isJsonContent(jsonOrText)
							? jsonContentToText(JSON.parse(jsonOrText))
							: jsonOrText;
						break;
					}
					case "file":
					case "dataStore":
					case "webPage":
					case "github":
					case "vectorStore":
						throw new Error(
							`Unsupported node type: ${sourceNode.content.type}`,
						);
					default: {
						const _exhaustiveCheck: never = sourceNode.content;
						throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
					}
				}
				break;
			default: {
				const _exhaustiveCheck: never = sourceNode;
				throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
			}
		}
	}
	return inputs;
}

function createActionOutput(
	result: unknown,
	generationContext: GenerationContext,
): GenerationOutput[] {
	const resultOutput = generationContext.operationNode.outputs.find(
		(output) => output.accessor === "action-result",
	);
	if (resultOutput === undefined) {
		return [];
	}
	return [
		{
			type: "generated-text",
			content: JSON.stringify(result),
			outputId: resultOutput.id,
		},
	];
}

async function executeGitHubAction(args: {
	state: GitHubActionConfiguredState;
	context: GiselleContext;
	generationContext: GenerationContext;
	generationContentResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>;
	appEntryResolver: AppEntryResolver;
}): Promise<GenerationOutput[]> {
	const authConfig = args.context.integrationConfigs?.github?.authV2;
	if (authConfig === undefined) {
		throw new Error("GitHub authV2 configuration is missing");
	}

	const inputs = await resolveActionInputs({
		state: args.state,
		generationContext: args.generationContext,
		generationContentResolver: args.generationContentResolver,
		appEntryResolver: args.appEntryResolver,
	});

	const commonAuthConfig = {
		strategy: "app-installation" as const,
		appId: authConfig.appId,
		privateKey: authConfig.privateKey,
		installationId: args.state.installationId,
	};

	function payloadSchema<TActionId extends GitHubActionId>(
		actionId: TActionId,
	): (typeof githubActions)[TActionId]["payload"] {
		return githubActions[actionId].payload;
	}

	switch (args.state.commandId) {
		case "github.create.issue": {
			const result = await createIssue({
				...payloadSchema(args.state.commandId).parse(inputs),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: commonAuthConfig,
			});
			return createActionOutput(result, args.generationContext);
		}
		case "github.create.issueComment": {
			const result = await createIssueComment({
				...payloadSchema(args.state.commandId).parse(inputs),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: commonAuthConfig,
			});
			return createActionOutput(result, args.generationContext);
		}
		case "github.create.pullRequestComment": {
			const result = await createPullRequestComment({
				...payloadSchema(args.state.commandId).parse(inputs),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: commonAuthConfig,
			});
			return createActionOutput(result, args.generationContext);
		}
		case "github.update.pullRequest": {
			const result = await updatePullRequest({
				...payloadSchema(args.state.commandId).parse(inputs),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: commonAuthConfig,
			});
			return createActionOutput(result, args.generationContext);
		}
		case "github.reply.pullRequestReviewComment": {
			const result = await replyPullRequestReviewComment({
				...payloadSchema(args.state.commandId).parse(inputs),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: commonAuthConfig,
			});
			return createActionOutput(result, args.generationContext);
		}
		case "github.create.discussionComment": {
			const { discussionNumber, body, commentId } = payloadSchema(
				args.state.commandId,
			).parse(inputs);

			const repo = await getRepositoryFullname(
				args.state.repositoryNodeId,
				commonAuthConfig,
			);
			if (repo.error || repo.data === undefined) {
				throw new Error(`Failed to get repository information: ${repo.error}`);
			}
			if (repo.data.node?.__typename !== "Repository") {
				throw new Error(
					`Invalid repository type: ${repo.data.node?.__typename}`,
				);
			}
			const discussion = await getDiscussionForCommentCreation({
				owner: repo.data.node.owner.login,
				name: repo.data.node.name,
				number: discussionNumber,
				authConfig: commonAuthConfig,
			});
			const discussionId = discussion.data?.repository?.discussion?.id;
			if (!discussionId) {
				throw new Error("Failed to get discussion ID");
			}
			let replyToId: string | undefined;
			if (commentId !== undefined) {
				const comments =
					discussion.data?.repository?.discussion?.comments?.nodes ?? [];
				replyToId = findDiscussionReplyTargetId({
					comments,
					targetDatabaseId: commentId,
				});
			}
			const result = await createDiscussionComment({
				discussionId,
				body,
				replyToId,
				authConfig: commonAuthConfig,
			});
			return createActionOutput(result, args.generationContext);
		}
		case "github.get.discussion": {
			const { discussionNumber } = payloadSchema(args.state.commandId).parse(
				inputs,
			);

			const repo = await getRepositoryFullname(
				args.state.repositoryNodeId,
				commonAuthConfig,
			);
			if (repo.error || repo.data === undefined) {
				throw new Error(`Failed to get repository information: ${repo.error}`);
			}
			if (repo.data.node?.__typename !== "Repository") {
				throw new Error(
					`Invalid repository type: ${repo.data.node?.__typename}`,
				);
			}
			const result = await getDiscussion({
				owner: repo.data.node.owner.login,
				name: repo.data.node.name,
				number: discussionNumber,
				authConfig: commonAuthConfig,
			});
			return createActionOutput(result.data, args.generationContext);
		}
		default: {
			const _exhaustiveCheck: never = args.state.commandId;
			throw new Error(`Unhandled command: ${_exhaustiveCheck}`);
		}
	}
}
