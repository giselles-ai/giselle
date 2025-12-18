"use client";

import { Button } from "@giselle-internal/ui/button";
import type { EndNode } from "@giselles-ai/protocol";
import { PlusIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import {
	useAppDesignerStore,
	useDeleteNode,
	useUpdateNodeData,
} from "../../../app-designer";
import {
	NodePanelHeader,
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui";
import { SettingLabel } from "../ui/setting-label";

export function EndNodePropertiesPanel({ node }: { node: EndNode }) {
	const deleteNode = useDeleteNode();
	const updateNodeData = useUpdateNodeData();
	const isStartNodeConnectedToEndNode = useAppDesignerStore((s) =>
		s.isStartNodeConnectedToEndNode(),
	);
	const isTryAppInStageDisabled = !isStartNodeConnectedToEndNode;

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				onDelete={() => deleteNode(node.id)}
				readonly
			/>
			<PropertiesPanelContent>
				{/* UI only. Actual binding/behavior will be implemented in a follow-up PR. */}
				<div className="flex flex-col gap-[16px]">
					<div className="space-y-0">
						<SettingLabel className="mb-0">Input Parameter</SettingLabel>
						<div className="px-[4px] py-0 w-full bg-transparent text-[14px] mt-[4px]">
							<ul className="w-full flex flex-col gap-[12px]">
								<li>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-[8px]">
											<span className="text-[14px]">Text</span>
											<span className="text-[12px] text-text-muted">
												multiline-text
											</span>
											<span className="bg-red-900/20 text-red-900 text-[12px] font-medium px-[6px] py-[1px] rounded-full">
												required
											</span>
										</div>
										<Button
											type="button"
											variant="subtle"
											size="default"
											leftIcon={<PlusIcon className="size-[12px]" />}
											disabled
										>
											Select Source
										</Button>
									</div>
								</li>
								<li>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-[8px]">
											<span className="text-[14px]">File</span>
											<span className="text-[12px] text-text-muted">files</span>
										</div>
										<Button
											type="button"
											variant="subtle"
											size="default"
											leftIcon={<PlusIcon className="size-[12px]" />}
											disabled
										>
											Select Source
										</Button>
									</div>
								</li>
							</ul>
						</div>
					</div>

					<button
						type="button"
						disabled={isTryAppInStageDisabled}
						className="mt-[12px] w-full rounded-[12px] border border-blue-muted bg-blue-muted px-[16px] py-[12px] text-[14px] font-medium text-white transition-[filter] enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<span className="inline-flex items-center justify-center gap-[8px]">
							<span>Try App in Stage</span>
							<SquareArrowOutUpRightIcon
								className="size-[14px]"
								aria-hidden="true"
							/>
						</span>
					</button>
					{isTryAppInStageDisabled && (
						<p className="text-[12px] text-text-muted">
							Connect your flow so it reaches the End Node from the Start Node
							to enable “Try App in Stage”.
						</p>
					)}
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
