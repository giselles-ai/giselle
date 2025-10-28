import type { TextNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { TextEditor } from "@giselle-sdk/text-editor/react";
import { useLayoutEffect, useRef, useState } from "react";
import { PropertiesPanelContent, PropertiesPanelRoot } from "../ui";
import { NodePanelHeader } from "../ui/node-panel-header";

export function TextNodePropertiesPanel({ node }: { node: TextNode }) {
	const { updateNodeDataContent, updateNodeData, deleteNode } =
		useWorkflowDesigner();

	const containerRef = useRef<HTMLDivElement>(null);
	const [_maxHeightPx, setMaxHeightPx] = useState<number | undefined>(
		undefined,
	);

	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const update = () => {
			const rect = el.getBoundingClientRect();
			setMaxHeightPx(rect.height);
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		window.addEventListener("resize", update);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", update);
		};
	}, []);

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/text-node"
				onDelete={() => deleteNode(node.id)}
			/>
			<PropertiesPanelContent>
				<div ref={containerRef} className="flex flex-col min-h-0">
					<TextEditor
						placeholder="Write or paste text here..."
						value={node.content.text}
						onValueChange={(text) => updateNodeDataContent(node, { text })}
						showToolbar={false}
						editorClassName="bg-inverse/10 border-none !pt-[4px] !pr-[8px] !pb-[4px] !pl-[12px] rounded-[8px] min-h-[120px]"
						minHeightClass="min-h-[120px]"
					/>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
