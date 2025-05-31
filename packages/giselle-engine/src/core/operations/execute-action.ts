import {
	type CompletedGeneration,
	type Connection,
	GenerationContext,
	type GenerationOutput,
	type GitHubActionCommandConfiguredState,
	type QueuedGeneration,
	isActionNode,
	isCompletedGeneration,
	isTextNode,
} from "@giselle-sdk/data-type";
import { githubActions } from "@giselle-sdk/flow";
import {
	createIssue,
	createIssueComment,
	createPullRequestComment,
} from "@giselle-sdk/github-tool";
import {
	isJsonContent,
	jsonContentToText,
} from "@giselle-sdk/text-editor-utils";
import type { Storage } from "unstorage";
import { internalSetGeneration } from "../generations/internal/set-generation";
import { getGeneration, getNodeGenerationIndexes } from "../generations/utils";
import type { GiselleEngineContext } from "../types";

async function resolveGeneration(args: {
	generationContext: GenerationContext;
	storage: Storage;
	connection: Connection;
}) {
	const nodeGenerationIndexes = await getNodeGenerationIndexes({
		storage: args.storage,
		nodeId: args.connection.outputNode.id,
	});
	if (
		nodeGenerationIndexes === undefined ||
		nodeGenerationIndexes.length === 0
	) {
		throw new Error("No generation found");
	}
	const generation = await getGeneration({
		...args,
		storage: args.storage,
		generationId: nodeGenerationIndexes[nodeGenerationIndexes.length - 1].id,
		options: {
			bypassingCache: true,
		},
	});
	if (generation === undefined || !isCompletedGeneration(generation)) {
		throw new Error("Generation not completed");
	}
	const output = generation.outputs.find(
		(output) => output.outputId === args.connection.outputId,
	);
	if (output === undefined || output.type !== "generated-text") {
		throw new Error("Output not found");
	}
	return output.content;
}

async function resolveGitHubActionInputs(args: {
	state: GitHubActionCommandConfiguredState;
	generation: QueuedGeneration;
	storage: Storage;
}) {
	const githubAction = githubActions[args.state.commandId];
	const result: Record<string, string> = {};
	const generationContext = GenerationContext.parse(args.generation.context);
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
			case "operation":
				result[parameter] = await resolveGeneration({
					generationContext,
					storage: args.storage,
					connection,
				});
				break;
			case "variable":
				switch (sourceNode.content.type) {
					case "text": {
						if (!isTextNode(sourceNode)) {
							throw new Error(`Unexpected node data: ${sourceNode.id}`);
						}
						const jsonOrText = sourceNode.content.text;
						result[parameter] = isJsonContent(jsonOrText)
							? jsonContentToText(JSON.parse(jsonOrText))
							: jsonOrText;
						break;
					}
					case "file":
					case "github":
					case "vectorStore":
						throw new Error(
							`Unsupported node type: ${sourceNode.content.type}`,
						);
					default: {
						const _exhaustiveCheck: never = sourceNode.content.type;
						throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
					}
				}
				break;
			default: {
				const _exhaustiveCheck: never = sourceNode;
				throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
			}
		}

		const nodeGenerationIndexes = await getNodeGenerationIndexes({
			storage: args.storage,
			nodeId: connection?.outputNode.id,
		});
		if (
			nodeGenerationIndexes === undefined ||
			nodeGenerationIndexes.length === 0
		) {
			continue;
		}
		const generation = await getGeneration({
			...args,
			storage: args.storage,
			generationId: nodeGenerationIndexes[nodeGenerationIndexes.length - 1].id,
		});
		if (generation === undefined || !isCompletedGeneration(generation)) {
			continue;
		}
		const output = generation.outputs.find(
			(output) => output.outputId === connection.outputId,
		);
		if (output === undefined || output.type !== "generated-text") {
			continue;
		}
		result[parameter] = output.content;
	}
	return result;
}

export async function executeAction(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
}) {
	const operationNode = args.generation.context.operationNode;
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
				generation: args.generation,
				inputs: await resolveGitHubActionInputs({
					state: command.state,
					generation: args.generation,
					storage: args.context.storage,
				}),
			});
			break;
		default: {
			const _exhaustiveCheck: never = command.provider;
			throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
		}
	}
	const completedGeneration = {
		...args.generation,
		status: "completed",
		messages: [],
		queuedAt: Date.now(),
		startedAt: Date.now(),
		completedAt: Date.now(),
		outputs: generationOutputs,
	} satisfies CompletedGeneration;

	await internalSetGeneration({
		storage: args.context.storage,
		generation: completedGeneration,
	});
}

async function executeGitHubActionCommand(args: {
	state: GitHubActionCommandConfiguredState;
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	inputs: Record<string, string>;
}): Promise<GenerationOutput[]> {
	const authConfig = args.context.integrationConfigs?.github?.authV2;
	if (authConfig === undefined) {
		throw new Error("GitHub authV2 configuration is missing");
	}
	switch (args.state.commandId) {
		case "github.create.issue": {
			const result = await createIssue({
				...githubActions["github.create.issue"].command.parameters.parse(
					args.inputs,
				),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: {
					strategy: "app-installation",
					appId: authConfig.appId,
					privateKey: authConfig.privateKey,
					installationId: args.state.installationId,
				},
			});
			const resultOutput = args.generation.context.operationNode.outputs.find(
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
		case "github.create.issueComment": {
			const result = await createIssueComment({
				...githubActions["github.create.issueComment"].command.parameters.parse(
					args.inputs,
				),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: {
					strategy: "app-installation",
					appId: authConfig.appId,
					privateKey: authConfig.privateKey,
					installationId: args.state.installationId,
				},
			});
			const resultOutput = args.generation.context.operationNode.outputs.find(
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
		case "github.create.pullRequestComment": {
			const result = await createPullRequestComment({
				...githubActions[
					"github.create.pullRequestComment"
				].command.parameters.parse(args.inputs),
				repositoryNodeId: args.state.repositoryNodeId,
				authConfig: {
					strategy: "app-installation",
					appId: authConfig.appId,
					privateKey: authConfig.privateKey,
					installationId: args.state.installationId,
				},
			});
			const resultOutput = args.generation.context.operationNode.outputs.find(
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
		default: {
			const _exhaustiveCheck: never = args.state.commandId;
			throw new Error(`Unhandled command: ${_exhaustiveCheck}`);
		}
	}
}
