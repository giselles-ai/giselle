import { triggerProviders } from "@giselle-sdk/flow";
import { z } from "zod/v4";
import { FlowTriggerId } from "../../flow/trigger";
import { Output } from "../base";

export const TriggerProviderLike = z.looseObject({
	provider: z.string(),
});
export type TriggerProviderLike = z.infer<typeof TriggerProviderLike>;

const TriggerUnconfiguredState = z.object({
	status: z.literal("unconfigured"),
});
const TriggerConfiguredState = z.object({
	status: z.literal("configured"),
	flowTriggerId: FlowTriggerId.schema,
});
const TriggerTemplateConfiguredState = z.object({
	status: z.literal("template-configured"),
	provider: z.literal("github"),
	eventId: z.string(),
	callsign: z.string().optional(),
	outputs: z.array(Output),
	name: z.string(),
});
const TriggerConfigurationState = z.discriminatedUnion("status", [
	TriggerUnconfiguredState,
	TriggerTemplateConfiguredState,
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
