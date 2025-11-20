import { createIdGenerator } from "@giselles-ai/utils";
import * as z from "zod/v4";

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

export const ManualTriggerEvent = z.object({
	id: z.literal("manual"),
	parameters: z.array(ManualTriggerParameter),
});
export type ManualTriggerEvent = z.infer<typeof ManualTriggerEvent>;

export const ManualTrigger = z.object({
	provider: Provider,
	event: ManualTriggerEvent,
	staged: z.boolean().default(false),
});
export type ManualTrigger = z.infer<typeof ManualTrigger>;
