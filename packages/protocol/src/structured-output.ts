import * as z from "zod/v4";

const StringProperty = z.object({
	type: z.literal("string"),
	description: z.string().optional(),
	enum: z.array(z.string()).optional(),
});

const NumberProperty = z.object({
	type: z.literal("number"),
	description: z.string().optional(),
});

const BooleanProperty = z.object({
	type: z.literal("boolean"),
	description: z.string().optional(),
});

type StructuredOutputPropertyType =
	| z.infer<typeof StringProperty>
	| z.infer<typeof NumberProperty>
	| z.infer<typeof BooleanProperty>
	| {
			type: "object";
			description?: string;
			properties: Record<string, StructuredOutputPropertyType>;
			required: string[];
			additionalProperties: false;
	  }
	| {
			type: "array";
			description?: string;
			items: StructuredOutputPropertyType;
	  };

const StructuredOutputProperty: z.ZodType<StructuredOutputPropertyType> =
	z.discriminatedUnion("type", [
		StringProperty,
		NumberProperty,
		BooleanProperty,
		z.object({
			type: z.literal("object"),
			description: z.string().optional(),
			properties: z.record(
				z.string(),
				z.lazy(() => StructuredOutputProperty),
			),
			required: z.array(z.string()),
			additionalProperties: z.literal(false),
		}),
		z.object({
			type: z.literal("array"),
			description: z.string().optional(),
			items: z.lazy(() => StructuredOutputProperty),
		}),
	]);

export const StructuredOutputSchema = z.object({
	title: z.string(),
	type: z.literal("object"),
	properties: z.record(z.string(), StructuredOutputProperty),
	additionalProperties: z.literal(false),
	required: z.array(z.string()),
});
export type StructuredOutputSchema = z.infer<typeof StructuredOutputSchema>;

export const OutputConfiguration = z.discriminatedUnion("outputFormat", [
	z.object({ outputFormat: z.literal("text") }),
	z.object({
		outputFormat: z.literal("json"),
		structuredOutputSchema: StructuredOutputSchema,
	}),
]);
export type OutputConfiguration = z.infer<typeof OutputConfiguration>;
