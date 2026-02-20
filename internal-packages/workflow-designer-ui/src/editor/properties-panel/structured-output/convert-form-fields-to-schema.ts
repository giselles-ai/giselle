import type { Schema, SubSchema } from "@giselles-ai/protocol";
import type { FormField } from "./types";

export function convertFormFieldsToSchema(
	title: string,
	fields: FormField[],
): Schema {
	const props: Record<string, SubSchema> = {};
	const required: string[] = [];

	for (const field of fields) {
		props[field.name] = convertFormFieldToSubSchema(field);
		required.push(field.name);
	}

	return {
		title,
		type: "object",
		properties: props,
		required,
		additionalProperties: false,
	};
}

function convertFormFieldToSubSchema(field: FormField): SubSchema {
	const base = createBaseSubSchema(field);
	const description = field.description.trim();
	if (description) {
		base.description = description;
	}
	return base;
}

function createBaseSubSchema(field: FormField): SubSchema {
	switch (field.type) {
		case "enum":
			return {
				type: "string",
				enum: field.enumValues,
			};
		case "object": {
			const properties: Record<string, SubSchema> = {};
			const required: string[] = [];
			for (const child of field.children) {
				properties[child.name] = convertFormFieldToSubSchema(child);
				required.push(child.name);
			}
			return {
				type: "object",
				properties,
				required,
				additionalProperties: false,
			};
		}
		case "array":
			return {
				type: "array",
				items: convertFormFieldToSubSchema(field.items),
			};
		case "string":
			return { type: "string" };
		case "number":
			return { type: "number" };
		case "boolean":
			return { type: "boolean" };
		default: {
			const _exhaustiveCheck: never = field;
			throw new Error(`Unhandled field type: ${_exhaustiveCheck}`);
		}
	}
}
