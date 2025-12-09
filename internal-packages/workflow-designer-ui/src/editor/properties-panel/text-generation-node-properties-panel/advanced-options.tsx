import type { TextGenerationNode } from "@giselles-ai/protocol";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { SettingDetail, SettingLabel } from "../ui/setting-label";
import { ToolsPanel } from "./tools";

export function AdvancedOptions({ node }: { node: TextGenerationNode }) {
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
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
				<div className="mt-[12px]">
					<SettingDetail className="mb-[6px]">Tools</SettingDetail>
					<ToolsPanel node={node} />
				</div>
			)}
		</div>
	);
}
