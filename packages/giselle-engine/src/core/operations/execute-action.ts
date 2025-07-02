import {
	type GenerationContext,
	type GenerationOutput,
	type GitHubActionCommandConfiguredState,
	isActionNode,
	isTextNode,
	type NodeId,
	type OutputId,
	type QueuedGeneration,
} from "@giselle-sdk/data-type";
import { githubActions } from "@giselle-sdk/flow";
import {
	createIssue,
	createIssueComment,
	createPullRequestComment,
	getDiscussion,
	getRepositoryFullname,
	replyPullRequestReviewComment,
} from "@giselle-sdk/github-tool";
import {
	isJsonContent,
	jsonContentToText,
} from "@giselle-sdk/text-editor-utils";
import { useGenerationExecutor } from "../generations/internal/use-generation-executor";
import type { GiselleEngineContext } from "../types";

export function executeAction(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
}) {
	return useGenerationExecutor({
		context: args.context,
		generation: args.generation,
		execute: async ({
			generationContext,
			generationContentResolver,
			completeGeneration,
		}) => {
			const operationNode = generationContext.operationNode;
			if (!isActionNode(operationNode)) {
				throw new Error("Invalid generation type");
			}
			const command = operationNode.content.command;
			if (command.state.status === "unconfigured") {
				throw new Error("Action is not configured");
			}
			let generationOutputs: GenerationOutput[] = [];
			switch (command.provider) {
				case "github":
					generationOutputs = await executeGitHubActionCommand({
						state: command.state,
						context: args.context,
						generationContext,
						generationContentResolver,
					});
					break;
				case "web-search":
					// TODO: Implement web-search action execution
					throw new Error("Web-search actions are not yet implemented");
				default: {
					// TODO: Uncomment after implementing all action providers
					// const _exhaustiveCheck: never = command.provider;
					// throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
					const unknownProvider = (command as { provider: string }).provider;
					throw new Error(`Unhandled provider: ${unknownProvider}`);
				}
			}
			await completeGeneration({
				outputs: generationOutputs,
			});
		},
	});
}

async function resolveActionInputs(args: {
	state: GitHubActionCommandConfiguredState;
	generationContext: GenerationContext;
	generationContentResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>;
}): Promise<Record<string, string>> {
	const githubAction = githubActions[args.state.commandId];
	const inputs: Record<string, string> = {};
	const generationContext = args.generationContext;

	for (const parameter of githubAction.command.parameters.keyof().options) {
		const input = generationContext.operationNode.inputs.find(
			(input) => input.accessor === parameter,
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
				const content = await args.generationContentResolver(
					connection.outputNode.id,
					connection.outputId,
				);
				if (content === undefined) {
					continue;
				}
				inputs[parameter] = content;
				break;
			}
			case "variable":
				switch (sourceNode.content.type) {
					case "text": {
						if (!isTextNode(sourceNode)) {
							throw new Error(`Unexpected node data: ${sourceNode.id}`);
						}
						const jsonOrText = sourceNode.content.text;
						inputs[parameter] = isJsonContent(jsonOrText)
							? jsonContentToText(JSON.parse(jsonOrText))
							: jsonOrText;
						break;
					}
					case "file":
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

async function executeGitHubActionCommand(args: {
	state: GitHubActionCommandConfiguredState;
	context: GiselleEngineContext;
	generationContext: GenerationContext;
	generationContentResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>;
}): Promise<GenerationOutput[]> {
	const authConfig = args.context.integrationConfigs?.github?.authV2;
	if (authConfig === undefined) {
		throw new Error("GitHub authV2 configuration is missing");
	}

	const inputs = await resolveActionInputs({
		state: args.state,
		generationContext: args.generationContext,
		generationContentResolver: args.generationContentResolver,
	});

	const commonAuthConfig = {
		strategy: "app-installation" as const,
		appId: authConfig.appId,
		privateKey: authConfig.privateKey,
		installationId: args.state.installationId,
	};

	switch (args.state.commandId) {
		case "github.create.issue": {
			const result = await createIssue({
				...githubActions["github.create.issue"].command.parameters.parse(
					inputs,
				),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: commonAuthConfig,
			});
			return createActionOutput(result, args.generationContext);
		}
		case "github.create.issueComment": {
			const result = await createIssueComment({
				...githubActions["github.create.issueComment"].command.parameters.parse(
					inputs,
				),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: commonAuthConfig,
			});
			return createActionOutput(result, args.generationContext);
		}
		case "github.create.pullRequestComment": {
			const result = await createPullRequestComment({
				...githubActions[
					"github.create.pullRequestComment"
				].command.parameters.parse(inputs),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: commonAuthConfig,
			});
			return createActionOutput(result, args.generationContext);
		}
		case "github.reply.pullRequestReviewComment": {
			const result = await replyPullRequestReviewComment({
				...githubActions[
					"github.reply.pullRequestReviewComment"
				].command.parameters.parse(inputs),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: commonAuthConfig,
			});
			return createActionOutput(result, args.generationContext);
		}
		case "github.get.discussion": {
			const { discussionNumber } =
				githubActions["github.get.discussion"].command.parameters.parse(inputs);
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
