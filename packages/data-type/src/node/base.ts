import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod";

export const InputId = createIdGenerator("inp");
export type InputId = z.infer<typeof InputId.schema>;

export const Input = z.object({
	id: InputId.schema,
	label: z.string(),
});
export type Input = z.infer<typeof Input>;

export const OutputId = createIdGenerator("otp");
export type OutputId = z.infer<typeof OutputId.schema>;

export const Output = z.object({
	id: OutputId.schema,
	label: z.string(),
});
export type Output = z.infer<typeof Output>;

export const NodeId = createIdGenerator("nd");
export type NodeId = z.infer<typeof NodeId.schema>;

export const NodeBase = z.object({
	id: NodeId.schema,
	name: z.string().optional(),
	type: z.string(),
	inputs: z.array(Input),
	outputs: z.array(Output),
});
export type NodeBase = z.infer<typeof NodeBase>;

export const Position = z.object({
	x: z.number(),
	y: z.number(),
});

export const NodeUIState = z.object({
	position: Position,
	selected: z.boolean().default(false).optional(),
	tab: z.string().optional(),
});
export type NodeUIState = z.infer<typeof NodeUIState>;

export const NodeReferenceBase = z.object({
	id: NodeId.schema,
	type: z.string(),
});
export type NodeReferenceBase = z.infer<typeof NodeReferenceBase>;
