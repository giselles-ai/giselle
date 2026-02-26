import type { FormField } from "./types";

export function hasDuplicateNames(fields: FormField[]): boolean {
	const names = fields.map((f) => f.name.trim()).filter(Boolean);
	if (new Set(names).size !== names.length) return true;
	return fields.some(
		(f) =>
			(f.type === "object" && hasDuplicateNames(f.children)) ||
			(f.type === "array" && hasFieldDuplicateNames(f.items)),
	);
}

function hasFieldDuplicateNames(field: FormField): boolean {
	if (field.type === "object") return hasDuplicateNames(field.children);
	if (field.type === "array") return hasFieldDuplicateNames(field.items);
	return false;
}

export function hasEmptyNames(fields: FormField[]): boolean {
	return fields.some((f) => {
		if (!f.name.trim()) return true;
		if (f.type === "object") return hasEmptyNames(f.children);
		if (f.type === "array") return hasFieldEmptyNames(f.items);
		return false;
	});
}

function hasFieldEmptyNames(field: FormField): boolean {
	if (field.type === "object") return hasEmptyNames(field.children);
	if (field.type === "array") return hasFieldEmptyNames(field.items);
	return false;
}

export function hasEmptyEnumValues(fields: FormField[]): boolean {
	return fields.some((f) => {
		if (f.type === "enum") return f.enumValues.length === 0;
		if (f.type === "object") return hasEmptyEnumValues(f.children);
		if (f.type === "array") return hasFieldEmptyEnumValues(f.items);
		return false;
	});
}

function hasFieldEmptyEnumValues(field: FormField): boolean {
	if (field.type === "enum") return field.enumValues.length === 0;
	if (field.type === "object") return hasEmptyEnumValues(field.children);
	if (field.type === "array") return hasFieldEmptyEnumValues(field.items);
	return false;
}
