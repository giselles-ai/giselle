import { triggerProviders } from "@giselle-sdk/flow";
import { z } from "zod";
import { FlowTriggerId } from "../../flow/trigger";

export const TriggerProviderLike = z
	.object({
		provider: z.string(),
	})
	.passthrough();
export type TriggerProviderLike = z.infer<typeof TriggerProviderLike>;

const TriggerUnconfiguredState = z.object({
	status: z.literal("unconfigured"),
});
const TriggerConfiguredState = z.object({
	status: z.literal("configured"),
	flowTriggerId: FlowTriggerId.schema,
});
const TriggerConfigurationState = z.discriminatedUnion("status", [
	TriggerUnconfiguredState,
	TriggerConfiguredState,
]);

export const TriggerContent = z.object({
	type: z.literal("trigger"),
	provider: z.enum(triggerProviders),
	state: TriggerConfigurationState,
});
export type TriggerContent = z.infer<typeof TriggerContent>;

export const TriggerContentReference = z.object({
	type: TriggerContent.shape.type,
});
export type TriggerContentReference = z.infer<typeof TriggerContentReference>;
