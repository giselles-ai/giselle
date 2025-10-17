"use client";

import type { NodeId } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../../editor/properties-panel/ui";
import { Button } from "../../ui/button";
import { useEditorStore, useEditorStoreWithEqualityFn } from "../store/context";

export function PropertiesPanel() {
	const inspectedNodeId = useEditorStore((s) => s.ui.inspectedNodeId);
	const setInspectedNodeId = useEditorStore((s) => s.setInspectedNodeId);

	const { node, updateNode } = useEditorStoreWithEqualityFn(
		(s) => ({
			node: inspectedNodeId
				? s.nodes.find((n) => n.id === inspectedNodeId)
				: undefined,
			updateNode: s.updateNode,
		}),
		(a, b) => a.node === b.node && a.updateNode === b.updateNode,
	);

	// Hide when nothing is selected/inspected or node not found.
	if (!inspectedNodeId || !node) return null;

	return (
		<aside
			className={clsx(
				"w-[420px] shrink-0 border-l border-black-300 h-full overflow-y-auto bg-bg-50/20",
			)}
			aria-label="Properties Panel"
		>
			<PropertiesPanelRoot>
				<PropertiesPanelHeader
					node={node}
					description={node.content.type}
					onChangeName={(name) => {
						updateNode(node.id as NodeId, { name });
					}}
					action={
						<Button
							type="button"
							onClick={() => setInspectedNodeId(undefined)}
							className="!py-[6px] !px-[10px]"
						>
							Close
						</Button>
					}
				/>

				<PropertiesPanelContent>
					{/* Minimal placeholder content; can be extended per node type */}
					<div className="text-[12px] text-white-700">
						<p className="mb-[8px]">Edit basic node properties.</p>
						<ul className="list-disc ml-[16px] space-y-[4px]">
							<li>Name: use the header to rename this node.</li>
							<li>Type: {node.content.type}</li>
							<li>ID: {node.id}</li>
						</ul>
					</div>
				</PropertiesPanelContent>
			</PropertiesPanelRoot>
		</aside>
	);
}
