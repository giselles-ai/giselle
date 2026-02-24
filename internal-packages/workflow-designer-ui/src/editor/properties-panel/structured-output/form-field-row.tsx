import { Input } from "@giselle-internal/ui/input";
import { Select } from "@giselle-internal/ui/select";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { typeConfig } from "./field-type-config";
import {
	changeFieldType,
	createEmptyFormField,
	type FormField,
	isFieldType,
	type ObjectFormField,
} from "./types";

const typeOptions = Object.entries(typeConfig).map(([value, config]) => ({
	value,
	label: config.label,
}));

type RenderExtra = ((field: FormField) => React.ReactNode) | undefined;
type IsTypeLocked = (fieldId: string) => boolean;

interface FormFieldRowProps {
	field: FormField;
	onChange: (updated: FormField) => void;
	onDelete: () => void;
	depth?: number;
	renderExtra?: RenderExtra;
	isTypeLocked?: IsTypeLocked;
}

export function FormFieldRow({
	field,
	onChange,
	onDelete,
	depth = 0,
	renderExtra,
	isTypeLocked = () => false,
}: FormFieldRowProps) {
	const config = typeConfig[field.type];
	const typeLocked = isTypeLocked(field.id);

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
					onValueChange={(newType) => {
						if (isFieldType(newType)) onChange(changeFieldType(field, newType));
					}}
					widthClassName="w-[80px]"
					placeholder="Type"
					triggerClassName="h-[32px] hover:cursor-pointer"
					disabled={typeLocked}
					renderTriggerContent={
						<span
							className={`text-[11px] font-bold tracking-wide ${config.colorClass}`}
						>
							{config.label}
						</span>
					}
				/>
				{renderExtra ? (
					renderExtra(field)
				) : (
					<Input
						value={field.description}
						onChange={(e) =>
							onChange({ ...field, description: e.target.value })
						}
						placeholder="Add description"
						className="flex-1 min-w-0"
					/>
				)}
				<button
					type="button"
					onClick={onDelete}
					className="shrink-0 p-[4px] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
				>
					<Trash2 className="size-[14px]" />
				</button>
			</div>

			{!typeLocked && field.type === "enum" && (
				<EnumValuesInput
					values={field.enumValues}
					onChange={(enumValues) => onChange({ ...field, enumValues })}
				/>
			)}

			{!typeLocked && field.type === "object" && (
				<ObjectFields
					field={field}
					onChange={onChange}
					depth={depth}
					renderExtra={renderExtra}
					isTypeLocked={isTypeLocked}
				/>
			)}

			{!typeLocked && field.type === "array" && (
				<ArrayItems
					items={field.items}
					onItemsChange={(updated) => onChange({ ...field, items: updated })}
					depth={depth}
					renderExtra={renderExtra}
					isTypeLocked={isTypeLocked}
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
	renderExtra,
	isTypeLocked,
}: {
	field: ObjectFormField;
	onChange: (updated: ObjectFormField) => void;
	depth: number;
	renderExtra?: RenderExtra;
	isTypeLocked?: IsTypeLocked;
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
					renderExtra={renderExtra}
					isTypeLocked={isTypeLocked}
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
	renderExtra,
	isTypeLocked = () => false,
}: {
	items: FormField;
	onItemsChange: (updated: FormField) => void;
	depth: number;
	renderExtra?: RenderExtra;
	isTypeLocked?: IsTypeLocked;
}) {
	const itemConfig = typeConfig[items.type];
	const itemTypeLocked = isTypeLocked(items.id);

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
					onValueChange={(newType) => {
						if (isFieldType(newType))
							onItemsChange(changeFieldType(items, newType));
					}}
					widthClassName="w-[80px]"
					placeholder="Type"
					triggerClassName="h-[32px]"
					disabled={itemTypeLocked}
					renderTriggerContent={
						<span
							className={`text-[11px] font-bold tracking-wide ${itemConfig.colorClass}`}
						>
							{itemConfig.label}
						</span>
					}
				/>
				{renderExtra ? (
					renderExtra(items)
				) : (
					<Input
						value={items.description}
						onChange={(e) =>
							onItemsChange({ ...items, description: e.target.value })
						}
						placeholder="Add description"
						className="flex-1 min-w-0"
					/>
				)}
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
					renderExtra={renderExtra}
					isTypeLocked={isTypeLocked}
				/>
			)}

			{items.type === "array" && (
				<ArrayItems
					items={items.items}
					onItemsChange={(updated) =>
						onItemsChange({ ...items, items: updated })
					}
					depth={depth + 1}
					renderExtra={renderExtra}
					isTypeLocked={isTypeLocked}
				/>
			)}
		</div>
	);
}
