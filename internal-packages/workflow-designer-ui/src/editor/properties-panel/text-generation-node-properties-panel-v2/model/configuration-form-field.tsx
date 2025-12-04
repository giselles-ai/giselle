import { Select } from "@giselle-internal/ui/select";
import { Toggle } from "@giselle-internal/ui/toggle";
import type { ConfigurationOption } from "@giselles-ai/language-model-registry";
import { titleCase } from "@giselles-ai/utils";
import type * as z from "zod/v4";
import { Slider } from "../../../../ui/slider";
import { SettingRow } from "../../ui/setting-row";

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
	defaultValue,
	onValueChange,
}: {
	name: string;
	option: ConfigurationOption<T>;
	value: unknown;
	defaultValue: unknown;
	onValueChange: (value: unknown) => void;
}) {
	const fieldType = option.schema.def.type;
	const label = option.ui?.label ?? titleCase(name);

	switch (fieldType) {
		case "enum": {
			const enumValues = getEnumValues(option.schema);
			const options = enumValues.map((v) => ({ value: v, label: v }));
			return (
				<SettingRow
					label={
						<label htmlFor={name} className="text-text text-[14px]">
							{label}
						</label>
					}
				>
					<Select
						id={name}
						placeholder={`Select ${label}`}
						value={String(value ?? "")}
						onValueChange={(v) => onValueChange(v)}
						options={options}
					/>
				</SettingRow>
			);
		}
		case "boolean":
			return (
				<Toggle
					name={name}
					checked={Boolean(value)}
					onCheckedChange={onValueChange}
				>
					<label htmlFor={name} className="text-[14px]">
						{label}
					</label>
				</Toggle>
			);
		case "number": {
			const numValue = Number(value ?? defaultValue);
			const step = option.ui?.step ?? 1;
			const min = option.ui?.min ?? 0;
			const max = option.ui?.max ?? Infinity;
			return (
				<Slider
					label={label}
					value={numValue}
					max={max}
					min={min}
					step={step}
					onChange={onValueChange}
				/>
			);
		}
		default:
			return null;
	}
}
