import type {
	CompletedGeneration,
	RunningGeneration,
} from "@giselle-sdk/data-type";
import type {
	LanguageModel,
	LanguageModelProvider,
	calculateDisplayCost,
} from "@giselle-sdk/language-model";
import type { ToolSet } from "ai";
import {
	type createLangfuseTracer,
	generateTelemetryTags,
} from "../generations/telemetry";
import type { TelemetrySettings } from "../generations/types";

export type CostTrackingEvent = {
	runningGeneration: RunningGeneration;
	completedGeneration: CompletedGeneration;
	tokenUsage: {
		promptTokens: number;
		completionTokens: number;
	};
	provider: LanguageModelProvider;
	modelId: string;
	telemetry?: TelemetrySettings;
	messages?: { messages: unknown[] };
	output?: string;
	toolSet?: ToolSet;
	configurations?: Record<string, unknown>;
	providerOptions?: Record<string, unknown>;
};

export class CostTracker {
	constructor(
		private readonly context: {
			calculateDisplayCost: typeof calculateDisplayCost;
			createLangfuseTracer: typeof createLangfuseTracer;
		},
	) {}

	async trackCost(event: CostTrackingEvent) {
		if (!event.tokenUsage) {
			return;
		}

		const costInfo = await this.context.calculateDisplayCost(
			event.provider,
			event.modelId,
			event.tokenUsage,
		);

		const langfuse = this.context.createLangfuseTracer({
			runningGeneration: event.runningGeneration,
			tags: generateTelemetryTags({
				provider: event.provider,
				modelId: event.modelId,
				toolSet: event.toolSet ?? {},
				configurations: event.configurations ?? {},
				providerOptions: event.providerOptions ?? {},
			}),
			messages: event.messages ?? { messages: [] },
			output: event.output ?? "",
			usage: {
				input: event.tokenUsage.promptTokens,
				output: event.tokenUsage.completionTokens,
				total:
					event.tokenUsage.promptTokens + event.tokenUsage.completionTokens,
				inputCost: costInfo?.inputCostForDisplay ?? 0,
				outputCost: costInfo?.outputCostForDisplay ?? 0,
				totalCost: costInfo?.totalCostForDisplay ?? 0,
				unit: "TOKENS",
			},
			completedGeneration: event.completedGeneration,
			spanName: "ai.streamText",
			generationName: "ai.streamText.doStream",
			settings: event.telemetry,
		});

		return langfuse;
	}
}
