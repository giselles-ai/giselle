"use client";

import type { NodeId } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { useCallback, useMemo } from "react";
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

	const handleClose = useCallback(() => {
		setInspectedNodeId(undefined);
	}, [setInspectedNodeId]);

	const handleChangeName = useCallback(
		(name?: string) => {
			// node.id only changes when selection changes, so dependencies are stable
			if (!node) return;
			if (typeof name === "string" && name.trim().length > 0) {
				updateNode(node.id as NodeId, { name });
				return;
			}
			// Clear name when the value is undefined or an empty string
			updateNode(node.id as NodeId, { name: undefined });
		},
		[node, updateNode],
	);

	const description = useMemo(() => node?.content.type, [node?.content.type]);

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
					description={description}
					onChangeName={(name) => handleChangeName(name ?? "")}
					action={
						<Button
							type="button"
							onClick={handleClose}
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
