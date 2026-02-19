import * as z from "zod/v4";

const StringSchema = z.object({
	type: z.literal("string"),
	description: z.string().optional(),
	enum: z.array(z.string()).optional(),
});

const NumberSchema = z.object({
	type: z.literal("number"),
	description: z.string().optional(),
});

const BooleanSchema = z.object({
	type: z.literal("boolean"),
	description: z.string().optional(),
});

export type SubSchema =
	| z.infer<typeof StringSchema>
	| z.infer<typeof NumberSchema>
	| z.infer<typeof BooleanSchema>
	| {
			type: "object";
			description?: string;
			properties: Record<string, SubSchema>;
			required: string[];
			additionalProperties: false;
	  }
	| {
			type: "array";
			description?: string;
			items: SubSchema;
	  };
const SubSchema: z.ZodType<SubSchema> = z.discriminatedUnion("type", [
	StringSchema,
	NumberSchema,
	BooleanSchema,
	z.object({
		type: z.literal("object"),
		description: z.string().optional(),
		properties: z.record(
			z.string(),
			z.lazy(() => SubSchema),
		),
		required: z.array(z.string()),
		additionalProperties: z.literal(false),
	}),
	z.object({
		type: z.literal("array"),
		description: z.string().optional(),
		items: z.lazy(() => SubSchema),
	}),
]);

export const Schema = z.object({
	title: z.string(),
	type: z.literal("object"),
	properties: z.record(z.string(), SubSchema),
	additionalProperties: z.literal(false),
	required: z.array(z.string()),
});
export type Schema = z.infer<typeof Schema>;

export const Output = z.discriminatedUnion("format", [
	z.object({ format: z.literal("text") }),
	z.object({
		format: z.literal("object"),
		schema: Schema,
	}),
]);
export type Output = z.infer<typeof Output>;
