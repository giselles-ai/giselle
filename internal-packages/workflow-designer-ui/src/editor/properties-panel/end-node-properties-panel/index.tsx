"use client";

import { Button } from "@giselle-internal/ui/button";
import type { EndNode } from "@giselles-ai/protocol";
import { useWorkflowDesigner } from "@giselles-ai/react";
import { ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import {
	NodePanelHeader,
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui";

export function EndNodePropertiesPanel({ node }: { node: EndNode }) {
	const { deleteNode, updateNodeData } = useWorkflowDesigner();

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				onDelete={() => deleteNode(node.id)}
				readonly
			/>
			<PropertiesPanelContent>
				{/* UI mock only: actual behavior will be implemented in a follow-up PR. */}
				<div className="flex flex-col gap-[20px]">
					<div className="flex items-center gap-[16px]">
						<div className="text-link-muted text-[12px] block mb-0 w-[120px] shrink-0">
							input node
						</div>
						<div className="flex-1 min-w-0">
							<div className="w-full rounded-[8px] border border-border/40 bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_8%,transparent)] px-[16px] py-[14px] flex items-center justify-center gap-[8px] text-[22px] text-inverse/80">
								<span className="truncate">gen node1</span>
								<ChevronsUpDownIcon className="size-[22px] shrink-0 text-inverse/60" />
							</div>
						</div>
						<Button type="button" variant="outline" size="large" disabled>
							Save
						</Button>
					</div>

					<div className="space-y-[8px]">
						<div className="text-link-muted text-[12px] block mb-0">
							Appの実行テキスト
						</div>
						<textarea
							className="w-full rounded-[8px] py-[10px] px-[12px] outline-none focus:outline-none border border-border/40 bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_8%,transparent)] text-inverse text-[14px] resize-none"
							rows={5}
							placeholder="(UI mock) Enter text to run this app in Stage"
							disabled
						/>
					</div>

					<div className="flex flex-col gap-[12px] pt-[8px]">
						<button
							type="button"
							disabled
							className="w-full flex items-center justify-center gap-[12px] rounded-[12px] border border-border/60 bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_6%,transparent)] px-[16px] py-[18px] text-[18px] font-medium text-inverse/80"
						>
							このAppをStageで実行する
							<span className="ml-auto shrink-0 w-[44px] h-[44px] rounded-[8px] flex items-center justify-center bg-primary-700/60 border border-primary-700/70">
								<ArrowUpIcon className="size-[20px] text-inverse" />
							</span>
						</button>
						<button
							type="button"
							disabled
							className="w-full rounded-[12px] bg-primary-700/80 border border-primary-700/70 px-[16px] py-[18px] text-[18px] font-semibold text-inverse"
						>
							アプリに移動
						</button>
					</div>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
