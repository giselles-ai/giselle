import {
	type CompletedGeneration,
	type FetchActionCommandConfiguredState,
	GenerationContext,
	type GenerationOutput,
	type GitHubActionCommandConfiguredState,
	type QueuedGeneration,
	isActionNode,
} from "@giselle-sdk/data-type";
import { createIssue } from "@giselle-sdk/github-tool";
import FirecrawlApp from "@mendable/firecrawl-js";
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
	let generationOutputs: GenerationOutput[] = [];
	switch (command.provider) {
		case "github":
			generationOutputs = await executeGitHubActionCommand({
				state: command.state,
				context: args.context,
				generation: args.generation,
			});
			break;
		case "fetch": {
			generationOutputs = await executeFetchActionCommand({
				state: command.state,
				context: args.context,
				generation: args.generation,
			});
			break;
		}
		default: {
			throw new Error("Unhandled action provider");
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
		outputs: generationOutputs,
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
}): Promise<GenerationOutput[]> {
	const authConfig = args.context.integrationConfigs?.github?.authV2;
	if (authConfig === undefined) {
		throw new Error("GitHub authV2 configuration is missing");
	}
	switch (args.state.commandId) {
		case "github.create.issue": {
			const result = await createIssue(
				args.state.repositoryNodeId,
				"title",
				"body",
				{
					strategy: "app-installation",
					appId: authConfig.appId,
					privateKey: authConfig.privateKey,
					installationId: args.state.installationId,
				},
			);
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
		case "github.create.issueComment":
			return [];
		default: {
			const _exhaustiveCheck: never = args.state.commandId;
			throw new Error(`Unhandled command: ${_exhaustiveCheck}`);
		}
	}
}

async function executeFetchActionCommand(args: {
	state: FetchActionCommandConfiguredState;
	context: GiselleEngineContext;
	generation: QueuedGeneration;
}): Promise<GenerationOutput[]> {
	const apiKey = process.env.FIRECRAWL_API_KEY;
	if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not set");
	const app = new FirecrawlApp({ apiKey });

	if (args.state.status !== "configured") {
		throw new Error("Fetch action is not configured");
	}

	const { urls, formats } = args.state;
	const result = await app.batchScrapeUrls(urls, {
		formats,
	});

	const resultOutput = args.generation.context.operationNode.outputs.find(
		(output) => output.accessor === "action-result",
	);
	if (resultOutput === undefined) {
		return [];
	}

	let content: string;
	if ("data" in result) {
		content = JSON.stringify(result.data);
	} else {
		// TODO: Handle error
		content = JSON.stringify(result);
	}

	return [
		{
			type: "generated-text",
			content,
			outputId: resultOutput.id,
		},
	];
}
