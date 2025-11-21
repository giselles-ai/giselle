import { Input } from "@giselle-internal/ui/input";
import { Select } from "@giselle-internal/ui/select";
import { Toggle } from "@giselle-internal/ui/toggle";
import type { ConfigurationOption } from "@giselles-ai/language-model-registry";
import type * as z from "zod/v4";

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
	switch (option.schema.def.type) {
		case "enum": {
			const enumValues = getEnumValues(option.schema);
			const options = enumValues.map((v) => ({ value: v, label: v }));
			return (
				<Select
					options={options}
					placeholder={`Select ${name}...`}
					value={String(value ?? "")}
					onValueChange={(v) => onChange(v)}
				/>
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
		case "number":
			return (
				<Input
					type="number"
					step={option.ui?.step ?? 1}
					value={String(value ?? "")}
					onChange={(e) => {
						const numValue = parseFloat(e.target.value);
						if (!Number.isNaN(numValue)) {
							onChange(numValue);
						}
					}}
				/>
			);
		default:
			<Input
				type="text"
				value={String(value ?? "")}
				onChange={(e) => onChange(e.target.value)}
			/>;
	}
}
