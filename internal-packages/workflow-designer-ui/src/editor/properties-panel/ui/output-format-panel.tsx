import { Select } from "@giselle-internal/ui/select";
import { Schema, type TextGenerationContent } from "@giselles-ai/protocol";
import { useState } from "react";
import { SettingDetail } from "./setting-label";

const outputFormatOptions = [
	{ value: "text", label: "Text" },
	{ value: "object", label: "JSON" },
];

const defaultSchema: Schema = {
	type: "object",
	properties: {
		title: { type: "string" },
		body: { type: "string" },
	},
	required: ["title", "body"],
	additionalProperties: false,
	title: "output",
};

type Output = TextGenerationContent["output"];

export function OutputFormatPanel({
	output,
	onOutputChange,
}: {
	output: Output;
	onOutputChange: (output: Output) => void;
}) {
	const hasOutputSchema = output.format === "object";

	const schemaObject = hasOutputSchema ? output.schema : defaultSchema;
	const [schemaText, setSchemaText] = useState(
		JSON.stringify(schemaObject, null, 2),
	);

	return (
		<>
			<Select
				options={outputFormatOptions}
				placeholder="Select format"
				value={output.format}
				onValueChange={(value) => {
					if (value === "object") {
						const schema = hasOutputSchema ? output.schema : defaultSchema;
						onOutputChange({ format: "object", schema });
					} else {
						onOutputChange({ format: "text" });
					}
				}}
			/>
			{hasOutputSchema && (
				<div className="mt-[8px]">
					<SettingDetail className="mb-[6px]">JSON Schema</SettingDetail>
					<textarea
						value={schemaText}
						onChange={(e) => setSchemaText(e.target.value)}
						onBlur={() => {
							try {
								const parsed = JSON.parse(schemaText);
								const result = Schema.safeParse(parsed);
								if (result.success && result.data) {
									onOutputChange({
										format: "object",
										schema: result.data,
									});
								}
							} catch {
								// keep local state as-is on invalid JSON
							}
						}}
						placeholder='{"type":"object","properties":{...}}'
						rows={6}
						className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-[8px] py-[6px] font-mono text-[13px] text-inverse"
					/>
				</div>
			)}
		</>
	);
}
