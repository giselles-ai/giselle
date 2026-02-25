import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { Input } from "@giselle-internal/ui/input";
import type {
	NodeLike,
	PropertyMapping,
	Schema,
	SubSchema,
} from "@giselles-ai/protocol";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { convertFormFieldsToSchema } from "../structured-output/convert-form-fields-to-schema";
import {
	convertSchemaToFormFields,
	convertSubSchemaToFormField,
} from "../structured-output/convert-schema-to-form-fields";
import { FormFieldRow } from "../structured-output/form-field-row";
import {
	changeFieldType,
	createEmptyFormField,
	type FieldType,
	type FormField,
} from "../structured-output/types";
import {
	hasDuplicateNames,
	hasEmptyEnumValues,
	hasEmptyNames,
} from "../structured-output/validation";
import { getNodeSchema } from "./get-node-schema";
import { OutputSourcePicker } from "./output-source-picker";

function getSubSchemaAtPath(
	schema: Schema,
	path: string[],
): SubSchema | undefined {
	if (path.length === 0) {
		return {
			type: "object",
			properties: schema.properties,
			required: schema.required,
			additionalProperties: false,
		};
	}
	let current: SubSchema | undefined = {
		type: "object",
		properties: schema.properties,
		required: schema.required,
		additionalProperties: false,
	};
	for (const segment of path) {
		if (!current) return undefined;
		if (current.type === "array") {
			current = current.items;
		}
		if (current.type !== "object") return undefined;
		current = current.properties[segment];
	}
	return current;
}

function createChildrenFromSubSchema(subSchema: SubSchema): FormField[] {
	if (subSchema.type === "object") {
		return Object.entries(subSchema.properties).map(([key, child]) =>
			convertSubSchemaToFormField(key, child),
		);
	}
	return [];
}

function applySourceSchemaToField(
	field: FormField,
	fieldType: FieldType,
	sourceNode: NodeLike,
	sourcePath: string[],
): FormField {
	const updated = changeFieldType(field, fieldType);
	if (updated.type !== "object" && updated.type !== "array") return updated;

	const schema = getNodeSchema(sourceNode);
	if (!schema) return updated;
	const subSchema = getSubSchemaAtPath(schema, sourcePath);
	if (!subSchema) return updated;

	if (updated.type === "object") {
		return { ...updated, children: createChildrenFromSubSchema(subSchema) };
	}
	if (subSchema.type === "array") {
		return {
			...updated,
			items: convertSubSchemaToFormField("items", subSchema.items),
		};
	}
	return updated;
}

interface StructuredOutputDialogProps {
	schema: Schema;
	mappings: PropertyMapping[];
	nodes: NodeLike[];
	onUpdate: (schema: Schema, mappings: PropertyMapping[]) => void;
	trigger: React.ReactNode;
}

function convertFieldSourceMappingToPropertyMappings(
	fields: FormField[],
	fieldSourceMapping: Map<string, PropertyMapping["source"]>,
	parentPath: string[] = [],
): PropertyMapping[] {
	const mappings: PropertyMapping[] = [];
	for (const field of fields) {
		const fieldPath = [...parentPath, field.name];
		const ref = fieldSourceMapping.get(field.id);
		if (ref) {
			mappings.push({ path: fieldPath, source: ref });
		}
		if (field.type === "object") {
			mappings.push(
				...convertFieldSourceMappingToPropertyMappings(
					field.children,
					fieldSourceMapping,
					fieldPath,
				),
			);
		}
		if (field.type === "array") {
			mappings.push(
				...convertFieldSourceMappingToPropertyMappings(
					[field.items],
					fieldSourceMapping,
					fieldPath,
				),
			);
		}
	}
	return mappings;
}

function isEqualPath(a: string[], b: string[]): boolean {
	return a.length === b.length && a.every((v, i) => v === b[i]);
}

function convertPropertyMappingsToFieldSourceMapping(
	fields: FormField[],
	mappings: PropertyMapping[],
	parentPath: string[] = [],
): Map<string, PropertyMapping["source"]> {
	const map = new Map<string, PropertyMapping["source"]>();
	for (const field of fields) {
		const fieldPath = [...parentPath, field.name];
		const mapping = mappings.find((m) => isEqualPath(m.path, fieldPath));
		if (mapping) {
			map.set(field.id, mapping.source);
		}
		if (field.type === "object") {
			const childMap = convertPropertyMappingsToFieldSourceMapping(
				field.children,
				mappings,
				fieldPath,
			);
			for (const [k, v] of childMap) {
				map.set(k, v);
			}
		}
		if (field.type === "array") {
			const itemMap = convertPropertyMappingsToFieldSourceMapping(
				[field.items],
				mappings,
				fieldPath,
			);
			for (const [k, v] of itemMap) {
				map.set(k, v);
			}
		}
	}
	return map;
}

function findFieldById(
	fields: FormField[],
	fieldId: string,
): FormField | undefined {
	for (const field of fields) {
		if (field.id === fieldId) return field;
		if (field.type === "object") {
			const found = findFieldById(field.children, fieldId);
			if (found) return found;
		}
		if (field.type === "array") {
			const found = findFieldById([field.items], fieldId);
			if (found) return found;
		}
	}
	return undefined;
}

function replaceFieldById(
	fields: FormField[],
	fieldId: string,
	newField: FormField,
): FormField[] {
	return fields.map((field) => {
		if (field.id === fieldId) return newField;
		if (field.type === "object") {
			const updated = replaceFieldById(field.children, fieldId, newField);
			if (updated !== field.children) return { ...field, children: updated };
		}
		if (field.type === "array") {
			const [updated] = replaceFieldById([field.items], fieldId, newField);
			if (updated !== field.items) return { ...field, items: updated };
		}
		return field;
	});
}

export function StructuredOutputDialog({
	schema,
	mappings,
	nodes,
	onUpdate,
	trigger,
}: StructuredOutputDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [fields, setFields] = useState<FormField[]>([]);
	const [fieldSourceMapping, setFieldSourceMapping] = useState<
		Map<string, PropertyMapping["source"]>
	>(new Map());
	const [errorMessage, setErrorMessage] = useState("");

	const handleOpen = useCallback(
		(open: boolean) => {
			if (open) {
				const parsed = convertSchemaToFormFields(schema);
				setTitle(parsed.title);
				setFields(parsed.fields);
				setFieldSourceMapping(
					convertPropertyMappingsToFieldSourceMapping(parsed.fields, mappings),
				);
				setErrorMessage("");
			}
			setIsOpen(open);
		},
		[schema, mappings],
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const trimmedTitle = title.trim();
			if (!trimmedTitle) {
				setErrorMessage("Title is required.");
				return;
			}
			if (hasEmptyNames(fields)) {
				setErrorMessage("All properties must have a name.");
				return;
			}
			if (hasDuplicateNames(fields)) {
				setErrorMessage("Duplicate property names are not allowed.");
				return;
			}
			if (hasEmptyEnumValues(fields)) {
				setErrorMessage("Enum fields must have at least one value.");
				return;
			}
			const newSchema = convertFormFieldsToSchema(trimmedTitle, fields);
			const newMappings = convertFieldSourceMappingToPropertyMappings(
				fields,
				fieldSourceMapping,
			);
			onUpdate(newSchema, newMappings);
			setIsOpen(false);
		},
		[title, fields, fieldSourceMapping, onUpdate],
	);

	const handleFieldChange = useCallback((index: number, updated: FormField) => {
		setFields((prev) => {
			const next = [...prev];
			next[index] = updated;
			return next;
		});
		setErrorMessage("");
	}, []);

	const handleFieldDelete = useCallback(
		(index: number) => {
			const deleted = fields[index];
			setFields((prev) => prev.filter((_, i) => i !== index));
			setFieldSourceMapping((prevMap) => {
				const newMap = new Map(prevMap);
				const collectIds = (field: FormField): string[] => {
					const ids = [field.id];
					if (field.type === "object") {
						for (const child of field.children) {
							ids.push(...collectIds(child));
						}
					}
					if (field.type === "array") {
						ids.push(...collectIds(field.items));
					}
					return ids;
				};
				for (const id of collectIds(deleted)) {
					newMap.delete(id);
				}
				return newMap;
			});
			setErrorMessage("");
		},
		[fields],
	);

	const handleAddField = useCallback(() => {
		setFields((prev) => [...prev, createEmptyFormField()]);
	}, []);

	const handleSourceSelect = useCallback(
		(fieldId: string, ref: PropertyMapping["source"], fieldType: FieldType) => {
			setFieldSourceMapping((prev) => {
				const next = new Map(prev);
				next.set(fieldId, ref);
				return next;
			});

			const sourceNode = nodes.find((n) => n.id === ref.nodeId);
			if (!sourceNode) return;

			setFields((prev) => {
				const targetField = findFieldById(prev, fieldId);
				if (!targetField) return prev;

				const newField = applySourceSchemaToField(
					targetField,
					fieldType,
					sourceNode,
					ref.path,
				);
				return replaceFieldById(prev, fieldId, newField);
			});
		},
		[nodes],
	);

	const handleSourceClear = useCallback((fieldId: string) => {
		setFieldSourceMapping((prev) => {
			const next = new Map(prev);
			next.delete(fieldId);
			return next;
		});
	}, []);

	const isTypeLocked = useCallback(
		(fieldId: string) => fieldSourceMapping.has(fieldId),
		[fieldSourceMapping],
	);

	const renderExtra = useCallback(
		(field: FormField) => (
			<OutputSourcePicker
				nodes={nodes}
				value={fieldSourceMapping.get(field.id)}
				onSelect={(ref, fieldType) =>
					handleSourceSelect(field.id, ref, fieldType)
				}
				onClear={() => handleSourceClear(field.id)}
			/>
		),
		[nodes, fieldSourceMapping, handleSourceSelect, handleSourceClear],
	);

	return (
		<Dialog open={isOpen} onOpenChange={handleOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent size="extra-wide" variant="glass">
				<div className="mb-4 shrink-0">
					<DialogTitle className="text-[20px] font-medium text-text tracking-tight font-sans">
						Structured Output (JSON)
					</DialogTitle>
					<DialogDescription className="text-[14px] text-text-muted font-geist mt-2">
						Define the output schema and map each property to a node output.
					</DialogDescription>
				</div>

				<DialogBody className="max-h-[60vh]">
					<form
						id="end-node-structured-output-form"
						onSubmit={handleSubmit}
						className="space-y-[16px]"
					>
						<div>
							<label
								htmlFor="end-structured-output-title"
								className="block text-[14px] text-white/60 mb-[6px]"
							>
								Name
							</label>
							<Input
								id="end-structured-output-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Schema name"
								className="w-full"
								required
							/>
						</div>

						<div>
							<div className="text-[14px] text-white/60 mb-[6px]">
								Properties
							</div>
							{fields.length > 0 && (
								<div className="flex items-center gap-[8px] text-[13px] text-white/30 mb-[4px]">
									<div className="w-[14px] shrink-0" />
									<div className="flex-1 min-w-0 border border-transparent px-[8px]">
										Name
									</div>
									<div className="w-[80px] shrink-0 border border-transparent px-[8px] text-center">
										Type
									</div>
									<div className="flex-1 min-w-0 border border-transparent px-[8px]">
										Value
									</div>
									<div className="w-[22px] shrink-0" />
								</div>
							)}
							<div className="space-y-[2px]">
								{fields.map((field, index) => (
									<FormFieldRow
										key={field.id}
										field={field}
										onChange={(updated) => handleFieldChange(index, updated)}
										onDelete={() => handleFieldDelete(index)}
										renderExtra={renderExtra}
										isTypeLocked={isTypeLocked}
										excludeTypes={["enum"]}
									/>
								))}
							</div>
							<button
								type="button"
								onClick={handleAddField}
								className="flex items-center gap-[4px] mt-[8px] text-[14px] text-white/40 hover:text-white/60 transition-colors cursor-pointer"
							>
								<Plus className="size-[14px]" />
								Add property
							</button>
						</div>

						{errorMessage && (
							<p className="text-[13px] text-red-400 mt-[8px]">
								{errorMessage}
							</p>
						)}
					</form>
				</DialogBody>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="filled" size="large">
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="submit"
						form="end-node-structured-output-form"
						variant="solid"
						size="large"
					>
						Update
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
