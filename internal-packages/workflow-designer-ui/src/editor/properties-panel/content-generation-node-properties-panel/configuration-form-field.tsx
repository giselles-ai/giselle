import { Input } from "@giselle-internal/ui/input";
import { Select } from "@giselle-internal/ui/select";
import { Toggle } from "@giselle-internal/ui/toggle";
import type { ConfigurationOption } from "@giselles-ai/language-model-registry";
import type * as z from "zod/v4";
import { Slider } from "../../../ui/slider";
import { ConfigurationFormFieldLabel } from "./configuration-form-field-label";

function getEnumValues(schema: z.ZodTypeAny): string[] {
	const def = schema.def;
	if (def.type === "enum") {
		return (schema as z.ZodEnum).options.map((option) => `${option}`);
	}
	return [];
}

export function ConfigurationFormField<T extends z.ZodType>({
	name,
	option,
	value,
	onChange,
}: {
	name: string;
	option: ConfigurationOption<T>;
	value: unknown;
	onChange: (value: unknown) => void;
}) {
	const fieldType = option.schema.def.type;

	switch (fieldType) {
		case "enum": {
			const enumValues = getEnumValues(option.schema);
			const options = enumValues.map((v) => ({ value: v, label: v }));
			return (
				<div className="flex flex-col gap-[4px]">
					<ConfigurationFormFieldLabel
						label={name}
						tooltip={option.description}
					/>
					<Select
						options={options}
						placeholder={`Select ${name}...`}
						value={String(value ?? "")}
						onValueChange={(v) => onChange(v)}
					/>
				</div>
			);
		}
		case "boolean":
			return (
				<Toggle
					name={name}
					checked={Boolean(value)}
					onCheckedChange={(checked) => onChange(checked)}
				>
					<span className="text-[14px] text-inverse">{option.description}</span>
				</Toggle>
			);
		case "number": {
			const numValue = Number(value ?? 0);
			const step = option.ui?.step ?? 1;
			const min = option.ui?.min ?? 0;
			const max = option.ui?.max ?? Infinity;
			return (
				<div className="flex flex-col gap-[4px]">
					<ConfigurationFormFieldLabel
						label={name}
						tooltip={option.description}
					/>
					<Slider
						label={name}
						value={numValue}
						min={min}
						max={max}
						step={step}
						onChange={(v) => onChange(v)}
					/>
				</div>
			);
		}
		default:
			return (
				<div className="flex flex-col gap-[4px]">
					<ConfigurationFormFieldLabel
						label={name}
						tooltip={option.description}
					/>
					<Input
						type="text"
						value={String(value ?? "")}
						onChange={(e) => onChange(e.target.value)}
					/>
				</div>
			);
	}
}
