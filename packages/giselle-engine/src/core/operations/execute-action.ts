import {
	type CompletedGeneration,
	GenerationContext,
	type GitHubActionCommandConfiguredState,
	type QueuedGeneration,
	isActionNode,
} from "@giselle-sdk/data-type";
import { createIssue } from "@giselle-sdk/github-tool";
import { setGeneration, setNodeGenerationIndex } from "../generations/utils";
import type { GiselleEngineContext } from "../types";

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
	switch (command.provider) {
		case "github":
			await executeGitHubActionCommand({
				state: command.state,
				context: args.context,
				generation: args.generation,
			});
			break;
		default: {
			const _exhaustiveCheck: never = command.provider;
			throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
		}
	}

	const generationContext = GenerationContext.parse(args.generation.context);
	const completedGeneration = {
		...args.generation,
		status: "completed",
		messages: [],
		queuedAt: Date.now(),
		startedAt: Date.now(),
		completedAt: Date.now(),
		outputs: [],
	} satisfies CompletedGeneration;

	await Promise.all([
		setGeneration({
			storage: args.context.storage,
			generation: completedGeneration,
		}),
		setNodeGenerationIndex({
			storage: args.context.storage,
			nodeId: generationContext.operationNode.id,
			origin: generationContext.origin,
			nodeGenerationIndex: {
				id: completedGeneration.id,
				nodeId: completedGeneration.context.operationNode.id,
				status: "completed",
				createdAt: completedGeneration.createdAt,
				queuedAt: completedGeneration.queuedAt,
				startedAt: completedGeneration.startedAt,
				completedAt: completedGeneration.completedAt,
			},
		}),
	]);
}

async function executeGitHubActionCommand(args: {
	state: GitHubActionCommandConfiguredState;
	context: GiselleEngineContext;
	generation: QueuedGeneration;
}) {
	const authConfig = args.context.integrationConfigs?.github?.authV2;
	if (authConfig === undefined) {
		throw new Error("GitHub authV2 configuration is missing");
	}
	switch (args.state.commandId) {
		case "github.create.issue":
			await createIssue(args.state.repositoryNodeId, "title", "body", {
				strategy: "app-installation",
				appId: authConfig.appId,
				privateKey: authConfig.privateKey,
				installationId: args.state.installationId,
			});
			break;
		case "github.create.issueComment":
			break;
		default: {
			const _exhaustiveCheck: never = args.state.commandId;
			throw new Error(`Unhandled command: ${_exhaustiveCheck}`);
		}
	}
}
