import type { Schema, SubSchema } from "@giselles-ai/protocol";
import type { FormField } from "./types";
import { generateFieldId } from "./types";

export function convertSchemaToFormFields({ title, properties }: Schema) {
	return {
		title,
		fields: Object.entries(properties).map(([key, subSchema]) =>
			convertSubSchemaToFormField(key, subSchema),
		),
	};
}

function convertSubSchemaToFormField(
	key: string,
	subSchema: SubSchema,
): FormField {
	const id = generateFieldId();
	const description = subSchema.description ?? "";

	switch (subSchema.type) {
		case "string": {
			if (subSchema.enum && subSchema.enum.length > 0) {
				return {
					id,
					name: key,
					type: "enum",
					description,
					enumValues: subSchema.enum,
				};
			}
			return {
				id,
				name: key,
				type: "string",
				description,
			};
		}
		case "number":
			return {
				id,
				name: key,
				type: "number",
				description,
			};
		case "boolean":
			return {
				id,
				name: key,
				type: "boolean",
				description,
			};
		case "object":
			return {
				id,
				name: key,
				type: "object",
				description,
				children: Object.entries(subSchema.properties).map(
					([childKey, childSubSchema]) =>
						convertSubSchemaToFormField(childKey, childSubSchema),
				),
			};
		case "array":
			return {
				id,
				name: key,
				type: "array",
				description,
				items: convertSubSchemaToFormField("", subSchema.items),
			};
		default: {
			const _exhaustiveCheck: never = subSchema;
			throw new Error(`Unhandled subSchema type: ${_exhaustiveCheck}`);
		}
	}
}
