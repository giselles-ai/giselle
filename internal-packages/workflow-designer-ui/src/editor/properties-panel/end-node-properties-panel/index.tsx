"use client";

import { Button } from "@giselle-internal/ui/button";
import type { EndNode } from "@giselles-ai/protocol";
import { useWorkflowDesigner } from "@giselles-ai/react";
import { PlusIcon } from "lucide-react";
import {
	NodePanelHeader,
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui";
import { SettingLabel } from "../ui/setting-label";

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
				{/* UI only. Actual binding/behavior will be implemented in a follow-up PR. */}
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
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
