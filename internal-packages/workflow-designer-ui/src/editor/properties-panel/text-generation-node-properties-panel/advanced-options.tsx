import { Select } from "@giselle-internal/ui/select";
import { Schema, type TextGenerationNode } from "@giselles-ai/protocol";
import { useFeatureFlag } from "@giselles-ai/react";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { useUpdateNodeDataContent } from "../../../app-designer";
import { SettingDetail, SettingLabel } from "../ui/setting-label";
import { ToolsPanel } from "./tools";

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

export function AdvancedOptions({ node }: { node: TextGenerationNode }) {
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const updateNodeDataContent = useUpdateNodeDataContent();
	const { structuredOutput } = useFeatureFlag();
	const output = node.content.output;
	const isObjectFormat = output.format === "object";

	const schemaObject = isObjectFormat ? output.schema : defaultSchema;
	const [schemaText, setSchemaText] = useState(
		JSON.stringify(schemaObject, null, 2),
	);

	return (
		<div className="col-span-2 rounded-[8px] bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_5%,transparent)] px-[8px] py-[8px] mt-[8px]">
			<button
				type="button"
				onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
				className="flex items-center gap-[8px] w-full text-left text-inverse hover:text-primary-900 transition-colors"
			>
				<ChevronRightIcon
					className={`size-[14px] text-link-muted transition-transform ${isAdvancedOpen ? "rotate-90" : ""}`}
				/>
				<SettingLabel inline className="mb-0">
					Advanced options
				</SettingLabel>
			</button>
			{isAdvancedOpen && (
				<div className="mt-[12px] space-y-[12px]">
					{structuredOutput && (
						<div>
							<SettingDetail className="mb-[6px]">Output format</SettingDetail>
							<Select
								options={outputFormatOptions}
								placeholder="Select format"
								value={output.format}
								onValueChange={(value) => {
									if (value === "object") {
										const schema = isObjectFormat
											? output.schema
											: defaultSchema;
										updateNodeDataContent(node, {
											output: { format: "object", schema },
										});
									} else {
										updateNodeDataContent(node, {
											output: { format: "text" },
										});
									}
								}}
							/>
						</div>
					)}
					{structuredOutput && isObjectFormat && (
						<div>
							<SettingDetail className="mb-[6px]">JSON Schema</SettingDetail>
							<textarea
								value={schemaText}
								onChange={(e) => setSchemaText(e.target.value)}
								onBlur={() => {
									try {
										const parsed = JSON.parse(schemaText);
										const result = Schema.safeParse(parsed);
										if (result.success && result.data) {
											updateNodeDataContent(node, {
												output: { format: "object", schema: result.data },
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
					<div>
						<SettingDetail className="mb-[6px]">Tools</SettingDetail>
						<ToolsPanel node={node} />
					</div>
				</div>
			)}
		</div>
	);
}
