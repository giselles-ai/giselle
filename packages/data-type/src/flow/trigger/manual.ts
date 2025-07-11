import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod/v4";

const Provider = z.literal("manual");

export const ManualParameterType = z.enum(["text", "multiline-text", "number"]);
export type ManualParameterType = z.infer<typeof ManualParameterType>;

export const ManualTriggerParameterId = createIdGenerator("mntgp");
export const ManualTriggerParameter = z.object({
	id: ManualTriggerParameterId.schema,
	name: z.string(),
	type: ManualParameterType,
	required: z.boolean(),
});
export type ManualTriggerParameter = z.infer<typeof ManualTriggerParameter>;

export const ManualFlowTriggerEvent = z.object({
	id: z.literal("manual"),
	parameters: z.array(ManualTriggerParameter),
});
export type ManualFlowTriggerEvent = z.infer<typeof ManualFlowTriggerEvent>;

export const ManualFlowTrigger = z.object({
	provider: Provider,
	event: ManualFlowTriggerEvent,
	staged: z.boolean().default(false),
});
export type ManualFlowTrigger = z.infer<typeof ManualFlowTrigger>;
