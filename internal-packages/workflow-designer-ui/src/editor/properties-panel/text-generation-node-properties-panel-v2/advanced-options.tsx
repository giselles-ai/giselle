import type { ContentGenerationNode } from "@giselles-ai/protocol";
import { useFeatureFlag } from "@giselles-ai/react";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { useUpdateNodeDataContent } from "../../../app-designer";
import { OutputFormatPanel } from "../ui/output-format-panel";
import { SettingDetail, SettingLabel } from "../ui/setting-label";
import { ToolsPanel } from "./tools";

export function AdvancedOptions({ node }: { node: ContentGenerationNode }) {
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const updateNodeDataContent = useUpdateNodeDataContent();
	const { structuredOutput } = useFeatureFlag();

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
							<OutputFormatPanel
								output={node.content.output}
								onOutputChange={(output) =>
									updateNodeDataContent(node, { output })
								}
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
