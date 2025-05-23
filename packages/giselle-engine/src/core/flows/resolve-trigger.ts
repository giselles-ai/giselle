import {
	type CompletedGeneration,
	GenerationContext,
	type GenerationInput,
	type GenerationOutput,
	type QueuedGeneration,
	isTriggerNode,
} from "@giselle-sdk/data-type";
import { githubTriggers } from "@giselle-sdk/flow";
import { isWebhookEvent } from "@giselle-sdk/github-tool";
import {
	setGeneration,
	setGenerationIndex,
	setNodeGenerationIndex,
} from "../generations/utils";
import { buildTriggerInputs } from "../github/trigger-utils";
import type { GiselleEngineContext } from "../types";
import { getFlowTrigger } from "./utils";

export async function resolveTrigger(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
	/** @todo Make this more generic. Should use GenerationContextInput. */
	githubWebhookEvent?: unknown;
}) {
	const operationNode = args.generation.context.operationNode;
	if (!isTriggerNode(operationNode)) {
		throw new Error("Invalid generation type");
	}
	if (operationNode.content.state.status !== "configured") {
		throw new Error("Trigger node is not configured");
	}
	const triggerData = await getFlowTrigger({
		storage: args.context.storage,
		flowTriggerId: operationNode.content.state.flowTriggerId,
	});

	const generationContext = GenerationContext.parse(args.generation.context);

	let githubWebhookInputs: GenerationInput[] | null = null;
	if (
		args.githubWebhookEvent !== undefined &&
		isWebhookEvent(args.githubWebhookEvent) &&
		triggerData.configuration.provider === "github"
	) {
		githubWebhookInputs = buildTriggerInputs({
			githubTrigger: githubTriggers[triggerData.configuration.event.id],
			trigger: triggerData,
			webhookEvent: args.githubWebhookEvent,
		});
	}

	const outputs: GenerationOutput[] = [];
	switch (triggerData.configuration.provider) {
		case "github": {
			const trigger = githubTriggers[triggerData.configuration.event.id];
			const inputsToUse = githubWebhookInputs ?? generationContext.inputs ?? [];
			for (const payload of trigger.event.payloads.keyof().options) {
				const input = inputsToUse.find((i) => i.name === payload);
				if (input === undefined) {
					continue;
				}
				const output = operationNode.outputs.find(
					(output) => output.accessor === payload,
				);
				if (output === undefined) {
					continue;
				}
				outputs.push({
					type: "generated-text",
					outputId: output.id,
					content: input.value,
				});
			}
			break;
		}
		case "manual": {
			for (const parameter of triggerData.configuration.event.parameters) {
				const input = generationContext.inputs?.find(
					(input) => input.name === parameter.id,
				);
				if (input === undefined) {
					continue;
				}
				const output = operationNode.outputs.find(
					(output) => output.accessor === parameter.id,
				);
				if (output === undefined) {
					continue;
				}

				outputs.push({
					type: "generated-text",
					outputId: output.id,
					content: input.value,
				});
			}
			break;
		}
		default: {
			const _exhaustiveCheck: never = triggerData.configuration;
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
		outputs,
	} satisfies CompletedGeneration;

	await Promise.all([
		setGeneration({
			storage: args.context.storage,
			generation: completedGeneration,
		}),
		setGenerationIndex({
			storage: args.context.storage,
			generationIndex: {
				id: completedGeneration.id,
				origin: completedGeneration.context.origin,
			},
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
