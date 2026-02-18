import { Select } from "@giselle-internal/ui/select";
import type { ContentGenerationNode } from "@giselles-ai/protocol";
import { useFeatureFlag } from "@giselles-ai/react";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { useUpdateNodeDataContent } from "../../../app-designer";
import { SettingDetail, SettingLabel } from "../ui/setting-label";
import { ToolsPanel } from "./tools";

const outputFormatOptions = [
	{ value: "text", label: "Text" },
	{ value: "json", label: "JSON" },
];

const defaultJsonSchema = JSON.stringify(
	{
		type: "object",
		properties: {
			title: { type: "string" },
			body: { type: "string" },
		},
		required: ["title", "body"],
		additionalProperties: false,
	},
	null,
	2,
);

export function AdvancedOptions({ node }: { node: ContentGenerationNode }) {
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const updateNodeDataContent = useUpdateNodeDataContent();
	const { structuredOutput } = useFeatureFlag();
	const outputFormat = node.content.outputFormat;
	const isJsonFormat = outputFormat === "json";

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
								value={outputFormat}
								onValueChange={(value) => {
									if (value === "json") {
										updateNodeDataContent(node, {
											outputFormat: "json",
											jsonSchema: node.content.jsonSchema ?? defaultJsonSchema,
										});
									} else {
										updateNodeDataContent(node, {
											outputFormat: "text",
											jsonSchema: undefined,
										});
									}
								}}
							/>
						</div>
					)}
					{structuredOutput && isJsonFormat && (
						<div>
							<SettingDetail className="mb-[6px]">JSON Schema</SettingDetail>
							<textarea
								value={node.content.jsonSchema ?? defaultJsonSchema}
								onChange={(e) =>
									updateNodeDataContent(node, { jsonSchema: e.target.value })
								}
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
