import {
	isTriggerProvider,
	type TriggerProvider,
} from "@giselles-ai/trigger-registry";
import { z } from "zod/v4";
import { TriggerId } from "../../trigger";

const TriggerUnconfiguredState = z.object({
	status: z.literal("unconfigured"),
});
const TriggerConfiguredState = z.object({
	status: z.literal("configured"),
	flowTriggerId: TriggerId.schema,
});
const TriggerReconfiguringState = z.object({
	status: z.literal("reconfiguring"),
	flowTriggerId: TriggerId.schema,
});
const TriggerConfigurationState = z.discriminatedUnion("status", [
	TriggerUnconfiguredState,
	TriggerConfiguredState,
	TriggerReconfiguringState,
]);

export const TriggerContent = z.object({
	type: z.literal("trigger"),
	provider: z.custom<TriggerProvider>((val) => isTriggerProvider(val)),
	state: TriggerConfigurationState,
});
export type TriggerContent = z.infer<typeof TriggerContent>;

export const TriggerContentReference = z.object({
	type: TriggerContent.shape.type,
});
export type TriggerContentReference = z.infer<typeof TriggerContentReference>;
