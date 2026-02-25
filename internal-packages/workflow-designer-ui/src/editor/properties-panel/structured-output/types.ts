import { z } from "zod/v4";

export const fieldTypes = [
	"string",
	"number",
	"boolean",
	"enum",
	"object",
	"array",
] as const;
const FieldTypeSchema = z.enum(fieldTypes);
export type FieldType = z.infer<typeof FieldTypeSchema>;

export function isFieldType(value: string): value is FieldType {
	return FieldTypeSchema.safeParse(value).success;
}

export function generateFieldId(): string {
	return Math.random().toString(36).slice(2);
}

interface BaseFormField {
	id: string;
	name: string;
	description: string;
}

interface StringFormField extends BaseFormField {
	type: "string";
}

interface NumberFormField extends BaseFormField {
	type: "number";
}

interface BooleanFormField extends BaseFormField {
	type: "boolean";
}

interface EnumFormField extends BaseFormField {
	type: "enum";
	enumValues: string[];
}

export interface ObjectFormField extends BaseFormField {
	type: "object";
	children: FormField[];
}

interface ArrayFormField extends BaseFormField {
	type: "array";
	items: FormField;
}

export type FormField =
	| StringFormField
	| NumberFormField
	| BooleanFormField
	| EnumFormField
	| ObjectFormField
	| ArrayFormField;

export function createEmptyFormField(): StringFormField {
	return {
		id: generateFieldId(),
		name: "",
		type: "string",
		description: "",
	};
}

export function changeFieldType(
	field: FormField,
	newType: FieldType,
): FormField {
	if (field.type === newType) return field;
	const base = {
		id: field.id,
		name: field.name,
		description: field.description,
	};
	switch (newType) {
		case "string":
			return { ...base, type: "string" };
		case "number":
			return { ...base, type: "number" };
		case "boolean":
			return { ...base, type: "boolean" };
		case "enum":
			return {
				...base,
				type: "enum",
				enumValues: field.type === "enum" ? field.enumValues : [],
			};
		case "object":
			return {
				...base,
				type: "object",
				children:
					field.type === "object" && field.children.length > 0
						? field.children
						: [createEmptyFormField()],
			};
		case "array":
			return {
				...base,
				type: "array",
				items:
				field.type === "array"
					? field.items
					: { ...createEmptyFormField(), name: "items" },
			};
	}
}
