import {
	type CompletedGeneration,
	GenerationContext,
	type GenerationContextInput,
	type GenerationOutput,
	type QueuedGeneration,
	isTriggerNode,
} from "@giselle-sdk/data-type";
import { githubTriggers } from "@giselle-sdk/flow";
import { internalSetGeneration } from "../generations/internal/set-generation";
import { resolveTrigger as resolveGitHubTrigger } from "../github/trigger-utils";
import type { GiselleEngineContext } from "../types";
import { getFlowTrigger } from "./utils";

export async function resolveTrigger(args: {
	context: GiselleEngineContext;
	generation: QueuedGeneration;
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

	const outputs: GenerationOutput[] = [];
	switch (triggerData.configuration.provider) {
		case "github": {
			switch (args.generation.context.origin.type) {
				case "run":
					{
						const githubWebhookEventInput = generationContext.inputs?.find(
							(input) => input.type === "github-webhook-event",
						);
						if (githubWebhookEventInput === undefined) {
							throw new Error("Missing github-webhook-event input");
						}
						if (triggerData.configuration.provider !== "github") {
							throw new Error("Invalid provider");
						}

						if (
							!args.context.integrationConfigs?.github?.authV2.appId ||
							!args.context.integrationConfigs?.github?.authV2.privateKey
						) {
							throw new Error("Missing GitHub App ID or Private Key");
						}
						for (const output of operationNode.outputs) {
							const resolveOutput = await resolveGitHubTrigger({
								output,
								githubTrigger:
									githubTriggers[triggerData.configuration.event.id],
								trigger: triggerData,
								webhookEvent: githubWebhookEventInput.webhookEvent,
								appId: args.context.integrationConfigs.github.authV2.appId,
								privateKey:
									args.context.integrationConfigs.github.authV2.privateKey,
								installationId: triggerData.configuration.installationId,
							});
							if (resolveOutput !== null) {
								outputs.push(resolveOutput);
							}
						}
					}

					break;
				case "workspace": {
					const parameterInput = generationContext.inputs?.find(
						(input) => input.type === "parameters",
					);
					if (parameterInput === undefined) {
						throw new Error("Missing Parameters Input");
					}

					for (const output of operationNode.outputs) {
						const inputItem = parameterInput.items.find(
							(item) => item.name === output.accessor,
						);
						if (inputItem === undefined) {
							continue;
						}
						outputs.push({
							outputId: output.id,
							type: "generated-text",
							content: `${inputItem.value}`,
						});
					}

					break;
				}
				default: {
					const _exhaustiveCheck: never = args.generation.context.origin;
					throw new Error(`Unhandled origin type: ${_exhaustiveCheck}`);
				}
			}
			break;
		}
		case "manual": {
			// Find ParametersInput once outside the loop
			const parametersInput = generationContext.inputs?.find(
				(i): i is GenerationContextInput & { type: "parameters" } =>
					i.type === "parameters",
			);

			// Create Map of outputs by accessor for O(1) lookup
			const outputsByAccessor = new Map(
				operationNode.outputs.map((output) => [output.accessor, output]),
			);

			for (const parameter of triggerData.configuration.event.parameters) {
				let parameterValue: string | undefined;

				if (parametersInput) {
					const parameterItem = parametersInput.items.find(
						(item) => item.name === parameter.id,
					);
					if (parameterItem) {
						parameterValue = parameterItem.value.toString();
					}
				}

				if (parameterValue === undefined) {
					continue;
				}

				const output = outputsByAccessor.get(parameter.id);
				if (output === undefined) {
					continue;
				}

				outputs.push({
					type: "generated-text",
					outputId: output.id,
					content: parameterValue,
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

	await internalSetGeneration({
		storage: args.context.storage,
		generation: completedGeneration,
	});
}
