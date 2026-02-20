import { Input } from "@giselle-internal/ui/input";
import { Select } from "@giselle-internal/ui/select";
import {
	Braces,
	Hash,
	List,
	Plus,
	ToggleLeft,
	Trash2,
	Type,
	X,
} from "lucide-react";
import { useState } from "react";
import {
	createEmptyFormField,
	type FieldType,
	type FormField,
	isFieldType,
	type ObjectFormField,
} from "./types";

const typeConfig: Record<
	FieldType,
	{ label: string; icon: React.ReactNode; colorClass: string }
> = {
	string: {
		label: "STR",
		icon: <Type className="size-[14px]" />,
		colorClass: "text-emerald-300",
	},
	number: {
		label: "NUM",
		icon: <Hash className="size-[14px]" />,
		colorClass: "text-teal-300",
	},
	boolean: {
		label: "BOOL",
		icon: <ToggleLeft className="size-[14px]" />,
		colorClass: "text-rose-400",
	},
	enum: {
		label: "ENUM",
		icon: <List className="size-[14px]" />,
		colorClass: "text-purple-400",
	},
	object: {
		label: "OBJ",
		icon: <Braces className="size-[14px]" />,
		colorClass: "text-blue-300",
	},
	array: {
		label: "ARR",
		icon: <List className="size-[14px]" />,
		colorClass: "text-indigo-300",
	},
};

const typeOptions = Object.entries(typeConfig).map(([value, config]) => ({
	value,
	label: config.label,
}));

function handleFormFieldTypeChange(
	field: FormField,
	newType: string,
	onChange: (updated: FormField) => void,
) {
	if (!isFieldType(newType)) return;
	const base = {
		id: field.id,
		name: field.name,
		description: field.description,
	};
	switch (newType) {
		case "string":
			onChange({ ...base, type: "string" });
			break;
		case "number":
			onChange({ ...base, type: "number" });
			break;
		case "boolean":
			onChange({ ...base, type: "boolean" });
			break;
		case "enum":
			onChange({
				...base,
				type: "enum",
				enumValues: field.type === "enum" ? field.enumValues : [],
			});
			break;
		case "object":
			onChange({
				...base,
				type: "object",
				children:
					field.type === "object" && field.children.length > 0
						? field.children
						: [createEmptyFormField()],
			});
			break;
		case "array":
			onChange({
				...base,
				type: "array",
				items: field.type === "array" ? field.items : createEmptyFormField(),
			});
			break;
		default: {
			const _exhaustiveCheck: never = newType;
			throw new Error(`Unhandled field type: ${_exhaustiveCheck}`);
		}
	}
}

interface FormFieldRowProps {
	field: FormField;
	onChange: (updated: FormField) => void;
	onDelete: () => void;
	depth?: number;
}

export function FormFieldRow({
	field,
	onChange,
	onDelete,
	depth = 0,
}: FormFieldRowProps) {
	const config = typeConfig[field.type];

	return (
		<div className={depth > 0 ? "pl-[24px]" : ""}>
			<div className="flex items-center gap-[8px] py-[4px]">
				<div className={`shrink-0 ${config.colorClass}`}>{config.icon}</div>
				<Input
					value={field.name}
					onChange={(e) => onChange({ ...field, name: e.target.value })}
					placeholder="Property name"
					className="flex-1 min-w-0"
					required
				/>
				<Select
					options={typeOptions}
					value={field.type}
					onValueChange={(newType) =>
						handleFormFieldTypeChange(field, newType, onChange)
					}
					widthClassName="w-[80px]"
					placeholder="Type"
					triggerClassName="h-[32px] hover:cursor-pointer"
					renderTriggerContent={
						<span
							className={`text-[11px] font-bold tracking-wide ${config.colorClass}`}
						>
							{config.label}
						</span>
					}
				/>
				<Input
					value={field.description}
					onChange={(e) => onChange({ ...field, description: e.target.value })}
					placeholder="Add description"
					className="flex-1 min-w-0"
				/>
				<button
					type="button"
					onClick={onDelete}
					className="shrink-0 p-[4px] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
				>
					<Trash2 className="size-[14px]" />
				</button>
			</div>

			{field.type === "enum" && (
				<EnumValuesInput
					values={field.enumValues}
					onChange={(enumValues) => onChange({ ...field, enumValues })}
				/>
			)}

			{field.type === "object" && (
				<ObjectFields field={field} onChange={onChange} depth={depth} />
			)}

			{field.type === "array" && (
				<ArrayItems
					items={field.items}
					onItemsChange={(updated) => onChange({ ...field, items: updated })}
					depth={depth}
				/>
			)}
		</div>
	);
}

function EnumValuesInput({
	values,
	onChange,
}: {
	values: string[];
	onChange: (values: string[]) => void;
}) {
	const [input, setInput] = useState("");

	const handleAdd = () => {
		const value = input.trim();
		if (!value) return;
		if (values.includes(value)) {
			setInput("");
			return;
		}
		onChange([...values, value]);
		setInput("");
	};

	return (
		<div className="pl-[22px] mt-[4px] mb-[4px]">
			{values.length > 0 && (
				<div className="flex flex-wrap gap-[4px] mb-[4px]">
					{values.map((value) => (
						<span
							key={value}
							className="inline-flex items-center gap-[4px] px-[8px] py-[2px] rounded-[4px] text-[13px] text-purple-400 bg-purple-400/12"
						>
							{value}
							<button
								type="button"
								onClick={() => onChange(values.filter((v) => v !== value))}
								className="ml-[2px] opacity-60 hover:opacity-100 cursor-pointer"
							>
								<X className="size-[14px]" />
							</button>
						</span>
					))}
				</div>
			)}
			<Input
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						handleAdd();
					}
				}}
				onBlur={handleAdd}
				placeholder="Type possible values and press enter"
				className="w-full"
				required={values.length === 0}
			/>
		</div>
	);
}

function ObjectFields({
	field,
	onChange,
	depth,
}: {
	field: ObjectFormField;
	onChange: (updated: ObjectFormField) => void;
	depth: number;
}) {
	return (
		<div className="mt-[2px]">
			{field.children.map((child, index) => (
				<FormFieldRow
					key={child.id}
					field={child}
					onChange={(updated) => {
						const next = [...field.children];
						next[index] = updated;
						onChange({ ...field, children: next });
					}}
					onDelete={() =>
						onChange({
							...field,
							children: field.children.filter((_, i) => i !== index),
						})
					}
					depth={depth + 1}
				/>
			))}
			<div className="pl-[24px]">
				<button
					type="button"
					onClick={() =>
						onChange({
							...field,
							children: [...field.children, createEmptyFormField()],
						})
					}
					className="flex items-center gap-[4px] mt-[4px] mb-[4px] text-[14px] text-white/40 hover:text-white/60 transition-colors cursor-pointer"
				>
					<Plus className="size-[14px]" />
					Add property
				</button>
			</div>
		</div>
	);
}

function ArrayItems({
	items,
	onItemsChange,
	depth,
}: {
	items: FormField;
	onItemsChange: (updated: FormField) => void;
	depth: number;
}) {
	const itemConfig = typeConfig[items.type];

	return (
		<div className="pl-[24px] mt-[2px]">
			<div className="flex items-center gap-[8px] py-[4px]">
				<div className={`shrink-0 ${itemConfig.colorClass}`}>
					{itemConfig.icon}
				</div>
				<span className="text-[13px] text-white/50 min-w-[90px]">
					Array items
				</span>
				<Select
					options={typeOptions}
					value={items.type}
					onValueChange={(newType) =>
						handleFormFieldTypeChange(items, newType, onItemsChange)
					}
					widthClassName="w-[80px]"
					placeholder="Type"
					triggerClassName="h-[32px]"
					renderTriggerContent={
						<span
							className={`text-[11px] font-bold tracking-wide ${itemConfig.colorClass}`}
						>
							{itemConfig.label}
						</span>
					}
				/>
				<Input
					value={items.description}
					onChange={(e) =>
						onItemsChange({ ...items, description: e.target.value })
					}
					placeholder="Add description"
					className="flex-1 min-w-0"
				/>
			</div>

			{items.type === "enum" && (
				<EnumValuesInput
					values={items.enumValues}
					onChange={(enumValues) => onItemsChange({ ...items, enumValues })}
				/>
			)}

			{items.type === "object" && (
				<ObjectFields
					field={items}
					onChange={(updated) => onItemsChange(updated)}
					depth={depth + 1}
				/>
			)}

			{items.type === "array" && (
				<ArrayItems
					items={items.items}
					onItemsChange={(updated) =>
						onItemsChange({ ...items, items: updated })
					}
					depth={depth + 1}
				/>
			)}
		</div>
	);
}
