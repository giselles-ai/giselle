import type {
	ContentGenerationContent,
	ContentGenerationNode,
} from "@giselles-ai/protocol";
import { useFeatureFlag } from "@giselles-ai/react";
import { ChevronRightIcon } from "lucide-react";
import { useCallback, useState } from "react";
import {
	useAppDesignerStore,
	useRemoveConnectionAndInput,
	useUpdateNodeData,
} from "../../../app-designer";
import {
	OutputFormatPanel,
	syncStructuredOutputPropertyOutputs,
} from "../ui/output-format-panel";
import { SettingDetail, SettingLabel } from "../ui/setting-label";
import { ToolsPanel } from "./tools";

export function AdvancedOptions({ node }: { node: ContentGenerationNode }) {
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
	const updateNodeData = useUpdateNodeData();
	const removeConnectionAndInput = useRemoveConnectionAndInput();
	const connections = useAppDesignerStore((s) => s.connections);
	const { structuredOutput } = useFeatureFlag();

	const handleOutputChange = useCallback(
		(output: ContentGenerationContent["output"]) => {
			const { outputs, removedOutputIds } = syncStructuredOutputPropertyOutputs(
				node.outputs,
				output,
			);
			const removedSet = new Set(removedOutputIds);
			for (const connection of connections) {
				if (removedSet.has(connection.outputId)) {
					removeConnectionAndInput(connection.id);
				}
			}
			updateNodeData(node, {
				content: { ...node.content, output },
				outputs,
			});
		},
		[node, connections, removeConnectionAndInput, updateNodeData],
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
						<div className="flex items-start justify-between gap-[12px]">
							<SettingDetail>Output Format</SettingDetail>
							<OutputFormatPanel
								output={node.content.output}
								onOutputChange={handleOutputChange}
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
