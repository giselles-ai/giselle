import { z } from "zod/v4";

const FieldTypeSchema = z.enum([
	"string",
	"number",
	"boolean",
	"enum",
	"object",
	"array",
]);
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

interface ObjectFormField extends BaseFormField {
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
