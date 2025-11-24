import { Input } from "@giselle-internal/ui/input";
import { Select } from "@giselle-internal/ui/select";
import type {
	LanguageModelTool,
	LanguageModelToolConfigurationOption,
} from "@giselles-ai/language-model-registry";
import { titleCase } from "@giselles-ai/utils";
import clsx from "clsx/lite";
import { Switch } from "radix-ui";
import { useEffect, useState } from "react";
import { ConfigurationFormFieldLabel } from "./configuration-form-field-label";
import { TagInputField } from "./tag-input-field";

function EnumField({
	name,
	label,
	option,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "enum" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	const options = option.options.map(
		(opt: { value: string; label?: string }) => ({
			value: opt.value,
			label: opt.label ?? opt.value,
		}),
	);
	return (
		<div className="flex justify-between">
			<ConfigurationFormFieldLabel label={label} tooltip={option.description} />
			<div>
				<Select
					widthClassName="w-fit"
					options={options}
					placeholder={`Select ${name}...`}
					value={String(value ?? "")}
					onValueChange={onValueChange}
				/>
			</div>
		</div>
	);
}

function BooleanField({
	label,
	option,
	value,
	onValueChange,
}: {
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "boolean" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	return (
		<div className="flex justify-between">
			<ConfigurationFormFieldLabel label={label} tooltip={option.description} />
			<Switch.Root
				className={clsx(
					"h-[15px] w-[27px] rounded-full outline-none transition-colors",
					"border border-border-muted data-[state=checked]:border-primary-900",
					"bg-transparent data-[state=checked]:bg-primary-900",
					"disabled:opacity-50 disabled:cursor-not-allowed",
				)}
				checked={Boolean(value)}
				onCheckedChange={onValueChange}
			>
				<Switch.Thumb
					className={clsx(
						"block size-[11px] translate-x-[2px] rounded-full",
						"bg-text-inverse",
						"transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[13px]",
					)}
				/>
			</Switch.Root>
		</div>
	);
}

function NumberField({
	name,
	label,
	option,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "number" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	const numValue = Number(value ?? option.defaultValue ?? 0);
	return (
		<div className="flex flex-col gap-[4px]">
			<ConfigurationFormFieldLabel label={label} tooltip={option.description} />
			<Input
				name={name}
				type="number"
				min={option.min}
				max={option.max}
				step={option.step ?? 1}
				value={numValue}
				onChange={(e) => {
					onValueChange(Number(e.target.value));
				}}
			/>
		</div>
	);
}

function ToolSelectionField({
	label,
	option,
	value,
	tools,
	onValueChange,
}: {
	label: string;
	option: Extract<
		LanguageModelToolConfigurationOption,
		{ type: "toolSelection" }
	>;
	value: unknown;
	tools: NonNullable<LanguageModelTool["tools"]>;
	onValueChange: (value: unknown) => void;
}) {
	const selectedTools = Array.isArray(value) ? (value as string[]) : [];
	return (
		<div className="flex flex-col gap-[8px]">
			<ConfigurationFormFieldLabel label={label} tooltip={option.description} />
			<div className="flex flex-col gap-[8px]">
				{tools.map((toolOption) => {
					const isSelected = selectedTools.includes(toolOption.name);
					return (
						<label
							key={toolOption.name}
							className="flex items-center gap-[8px] cursor-pointer"
						>
							<input
								type="checkbox"
								checked={isSelected}
								onChange={(e) => {
									const newSelectedTools = e.target.checked
										? [...selectedTools, toolOption.name]
										: selectedTools.filter((t) => t !== toolOption.name);
									onValueChange(newSelectedTools);
								}}
								className="size-[16px] rounded border-border"
							/>
							<span className="text-[14px] text-text">
								{toolOption.title ?? toolOption.name}
							</span>
							{toolOption.description && (
								<span className="text-[12px] text-text-muted">
									- {toolOption.description}
								</span>
							)}
						</label>
					);
				})}
			</div>
		</div>
	);
}

function TagArrayField({
	label,
	option,
	value,
	onValueChange,
}: {
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "tagArray" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	const arrayValue = Array.isArray(value) ? (value as string[]) : [];
	return (
		<TagInputField
			label={label}
			value={arrayValue}
			onValueChange={(newValue) => onValueChange(newValue)}
			placeholder={option.placeholder}
			description={option.description}
			validate={option.validate}
		/>
	);
}

function ObjectField({
	name,
	label,
	option,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "object" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	// For objects, show as JSON input
	const objectValue =
		typeof value === "object" && value !== null
			? JSON.stringify(value, null, 2)
			: "";
	const [jsonText, setJsonText] = useState(objectValue);

	useEffect(() => {
		try {
			const currentParsed = JSON.parse(jsonText || "{}");
			// If currentValue matches what we have in text, don't update text (preserve formatting)
			if (JSON.stringify(value ?? {}) !== JSON.stringify(currentParsed)) {
				setJsonText(
					typeof value === "object" && value !== null
						? JSON.stringify(value, null, 2)
						: "",
				);
			}
		} catch {
			// Invalid JSON or mismatch, handle appropriately
		}
	}, [value, jsonText]);

	return (
		<div className="flex flex-col gap-[4px]">
			<ConfigurationFormFieldLabel label={label} tooltip={option.description} />
			<textarea
				name={`${name}_display`}
				className="min-h-[100px] w-full rounded-md border border-border bg-bg px-3 py-2 text-[14px] text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
				value={jsonText}
				onChange={(e) => {
					const newValue = e.target.value;
					setJsonText(newValue);
					try {
						const parsed = JSON.parse(newValue);
						onValueChange(parsed);
					} catch {
						// Invalid JSON, don't update parent yet
					}
				}}
				placeholder="JSON object"
			/>
		</div>
	);
}

function TextField({
	name,
	label,
	option,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
	option: Extract<LanguageModelToolConfigurationOption, { type: "text" }>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	return (
		<div className="flex flex-col gap-[4px]">
			<ConfigurationFormFieldLabel label={label} tooltip={option.description} />
			<Input
				name={name}
				type="text"
				value={String(value ?? option.defaultValue ?? "")}
				onChange={(e) => {
					onValueChange(e.target.value);
				}}
				placeholder={option.placeholder}
			/>
		</div>
	);
}

function ToolConfigurationField({
	name,
	option,
	value,
	defaultValue,
	tool,
	onValueChange,
}: {
	name: string;
	option: LanguageModelToolConfigurationOption;
	value: unknown;
	defaultValue?: unknown;
	tool?: LanguageModelTool;
	onValueChange: (value: unknown) => void;
}) {
	const label = option.title ?? titleCase(name);
	const currentValue = value ?? defaultValue ?? option.defaultValue;

	switch (option.type) {
		case "enum":
			return (
				<EnumField
					name={name}
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		case "boolean":
			return (
				<BooleanField
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		case "number":
			return (
				<NumberField
					name={name}
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		case "toolSelection":
			if (!tool?.tools) {
				return null;
			}
			return (
				<ToolSelectionField
					label={label}
					option={option}
					value={currentValue}
					tools={tool.tools}
					onValueChange={onValueChange}
				/>
			);
		case "tagArray":
			return (
				<TagArrayField
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		case "object":
			return (
				<ObjectField
					name={name}
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		case "text":
			return (
				<TextField
					name={name}
					label={label}
					option={option}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		default: {
			const _exhaustiveCheck: never = option;
			return null;
		}
	}
}

export function ToolConfigurationForm({
	tool,
	currentConfig,
	onConfigChange,
}: {
	tool: LanguageModelTool;
	currentConfig?: Record<string, unknown>;
	onConfigChange: (config: Record<string, unknown>) => void;
}) {
	return (
		<div className="flex flex-col gap-[20px]">
			{Object.entries(tool.configurationOptions).map(([key, option]) => {
				const value = currentConfig?.[key];
				return (
					<ToolConfigurationField
						key={key}
						name={key}
						option={option}
						value={value}
						tool={tool}
						onValueChange={(newValue) => {
							onConfigChange({ ...currentConfig, [key]: newValue });
						}}
					/>
				);
			})}
		</div>
	);
}
