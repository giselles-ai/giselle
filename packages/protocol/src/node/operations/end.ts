import * as z from "zod/v4";
import { Schema } from "../../structured-output";
import { NodeId, OutputId } from "../base";

const PropertyMapping = z.object({
	path: z.array(z.string()).nonempty(),
	source: z.object({
		nodeId: NodeId.schema,
		outputId: OutputId.schema,
		path: z.array(z.string()),
	}),
});
export type PropertyMapping = z.infer<typeof PropertyMapping>;

export const EndOutputSchema = z.discriminatedUnion("format", [
	z.object({ format: z.literal("passthrough") }),
	z.object({
		format: z.literal("object"),
		schema: Schema,
		mappings: z.array(PropertyMapping),
	}),
]);
export type EndOutput = z.infer<typeof EndOutputSchema>;

export const EndContent = z.object({
	type: z.literal("end"),
	output: EndOutputSchema.default({ format: "passthrough" }),
});
export type EndContent = z.infer<typeof EndContent>;

export const EndContentReference = z.object({
	type: EndContent.shape.type,
});
export type EndContentReference = z.infer<typeof EndContentReference>;
