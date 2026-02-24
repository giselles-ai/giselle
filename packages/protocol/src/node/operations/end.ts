import * as z from "zod/v4";
import { Schema } from "../../structured-output";
import { NodeId, OutputId } from "../base";

const Source = z.object({
	nodeId: NodeId.schema,
	outputId: OutputId.schema,
	path: z.array(z.string()),
});
export type Source = z.infer<typeof Source>;

const PropertyMapping = z.object({
	path: z.array(z.string()),
	source: Source,
});
export type PropertyMapping = z.infer<typeof PropertyMapping>;

const Output = z.discriminatedUnion("format", [
	z.object({ format: z.literal("passthrough") }),
	z.object({
		format: z.literal("object"),
		schema: Schema,
		mappings: z.array(PropertyMapping),
	}),
]);

export const EndContent = z.object({
	type: z.literal("end"),
	output: Output.default({ format: "passthrough" }),
});
export type EndContent = z.infer<typeof EndContent>;

export const EndContentReference = z.object({
	type: EndContent.shape.type,
});
export type EndContentReference = z.infer<typeof EndContentReference>;
