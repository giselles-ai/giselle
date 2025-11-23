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
import type * as z from "zod/v4";
import { ConfigurationFormFieldLabel } from "./configuration-form-field-label";

function getEnumValues(schema: z.ZodTypeAny): string[] {
	const def = schema.def;
	if (def.type === "enum") {
		return (schema as z.ZodEnum).options.map((option) => `${option}`);
	}
	return [];
}

function getNumberConstraints(schema: z.ZodTypeAny): {
	min?: number;
	max?: number;
	step?: number;
} {
	const def = schema.def;
	if (def.type === "number") {
		// Try to extract min/max from schema checks
		const checks = (def as { checks?: Array<{ kind: string; value?: number }> })
			.checks;
		return {
			min: checks?.find((c: { kind: string }) => c.kind === "min")?.value,
			max: checks?.find((c: { kind: string }) => c.kind === "max")?.value,
			step: 1,
		};
	}
	return {};
}

function EnumField({
	name,
	label,
	option,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
	option: LanguageModelToolConfigurationOption<z.ZodType>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	const enumValues = getEnumValues(option.schema);
	const options = enumValues.map((v) => ({ value: v, label: v }));
	return (
		<div className="flex justify-between">
			<ConfigurationFormFieldLabel label={label} />
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
	value,
	onValueChange,
}: {
	label: string;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	return (
		<div className="flex justify-between">
			<ConfigurationFormFieldLabel label={label} />
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
	option: LanguageModelToolConfigurationOption<z.ZodType>;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	const { min, max, step } = getNumberConstraints(option.schema);
	const numValue = Number(value ?? 0);
	return (
		<div className="flex flex-col gap-[4px]">
			<ConfigurationFormFieldLabel label={label} />
			<Input
				name={name}
				type="number"
				min={min}
				max={max}
				step={step}
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
	value,
	tools,
	onValueChange,
}: {
	label: string;
	value: unknown;
	tools: NonNullable<LanguageModelTool["tools"]>;
	onValueChange: (value: unknown) => void;
}) {
	const selectedTools = Array.isArray(value) ? (value as string[]) : [];
	return (
		<div className="flex flex-col gap-[8px]">
			<ConfigurationFormFieldLabel label={label} />
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

function ArrayField({
	label,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
	value: unknown;
	tool?: LanguageModelTool;
	onValueChange: (value: unknown) => void;
}) {
	// Special handling for useTools: show checkboxes for available tools

	// For other arrays, show as comma-separated input
	const arrayValue = Array.isArray(value) ? value.join(", ") : "";
	const [textValue, setTextValue] = useState(arrayValue);

	useEffect(() => {
		if (Array.isArray(value)) {
			const newStr = value.join(", ");
			// Only update if conceptually different to allow flexible typing
			const currentParsed = textValue
				.split(",")
				.map((v) => v.trim())
				.filter(Boolean);
			if (JSON.stringify(value) !== JSON.stringify(currentParsed)) {
				setTextValue(newStr);
			}
		}
	}, [value, textValue]);

	return (
		<div className="flex flex-col gap-[4px]">
			<ConfigurationFormFieldLabel label={label} />
			<Input
				type="text"
				value={textValue}
				onChange={(e) => {
					const newValue = e.target.value;
					setTextValue(newValue);
					const values = newValue
						.split(",")
						.map((v) => v.trim())
						.filter(Boolean);
					onValueChange(values);
				}}
				placeholder="Comma-separated values"
			/>
		</div>
	);
}

function ObjectField({
	name,
	label,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
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
			<ConfigurationFormFieldLabel label={label} />
			<textarea
				name={`${name}_display`}
				className="min-h-[100px] w-full rounded-md border border-border bg-bg px-3 py-2 text-[14px] text-inverse placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
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

function DefaultField({
	name,
	label,
	value,
	onValueChange,
}: {
	name: string;
	label: string;
	value: unknown;
	onValueChange: (value: unknown) => void;
}) {
	return (
		<div className="flex flex-col gap-[4px]">
			<ConfigurationFormFieldLabel label={label} />
			<Input
				name={name}
				type="text"
				value={String(value ?? "")}
				onChange={(e) => {
					onValueChange(e.target.value);
				}}
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
	option: LanguageModelToolConfigurationOption<z.ZodType>;
	value: unknown;
	defaultValue?: unknown;
	tool?: LanguageModelTool;
	onValueChange: (value: unknown) => void;
}) {
	const fieldType = option.schema.def.type;
	const label = option.title ?? titleCase(name);
	const currentValue = value ?? defaultValue;

	switch (fieldType) {
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
		case "array":
			if (name === "useTools" && tool?.tools) {
				return (
					<ToolSelectionField
						label={label}
						value={value}
						tools={tool.tools}
						onValueChange={onValueChange}
					/>
				);
			}
			return (
				<ArrayField
					name={name}
					label={label}
					value={currentValue}
					tool={tool}
					onValueChange={onValueChange}
				/>
			);
		case "object":
			return (
				<ObjectField
					name={name}
					label={label}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
		default:
			return (
				<DefaultField
					name={name}
					label={label}
					value={currentValue}
					onValueChange={onValueChange}
				/>
			);
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
