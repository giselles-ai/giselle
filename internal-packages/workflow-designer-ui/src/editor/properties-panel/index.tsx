import {
	isActionNode,
	isFileNode,
	isImageGenerationNode,
	isQueryNode,
	isTextGenerationNode,
	isTextNode,
	isTriggerNode,
	isVectorStoreNode,
	isWebPageNode,
} from "@giselle-sdk/data-type";
import { useWorkflowDesignerStore } from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { useShallow } from "zustand/shallow";
import { ActionNodePropertiesPanel } from "./action-node-properties-panel";
import { FileNodePropertiesPanel } from "./file-node-properties-panel";
import { ImageGenerationNodePropertiesPanel } from "./image-generation-node-properties-panel";
import { QueryNodePropertiesPanel } from "./query-node-properties-panel";
import { TextGenerationNodePropertiesPanel } from "./text-generation-node-properties-panel";
import { TextNodePropertiesPanel } from "./text-node-properties-panel";
import { TriggerNodePropertiesPanel } from "./trigger-node-properties-panel";
import { VectorStoreNodePropertiesPanel } from "./vector-store";
import { WebPageNodePropertiesPanel } from "./web-page-node-properties-panel";

export function PropertiesPanel() {
	const selectedNodes = useWorkflowDesignerStore(
		useShallow((s) =>
			s.workspace.nodes.filter(
				(node) => s.workspace.ui.nodeState[node.id]?.selected,
			),
		),
	);
	const setCurrentShortcutScope = useWorkflowDesignerStore(
		(s) => s.setCurrentShortcutScope,
	);
	return (
		<section
			className={clsx("h-full text-inverse")}
			aria-label="Properties Panel"
			onFocus={() => setCurrentShortcutScope("properties-panel")}
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget)) {
					setCurrentShortcutScope("canvas");
				}
			}}
			tabIndex={-1}
		>
			{isTextGenerationNode(selectedNodes[0]) && (
				<TextGenerationNodePropertiesPanel
					node={selectedNodes[0]}
					key={selectedNodes[0].id}
				/>
			)}
			{isImageGenerationNode(selectedNodes[0]) && (
				<ImageGenerationNodePropertiesPanel
					node={selectedNodes[0]}
					key={selectedNodes[0].id}
				/>
			)}
			{isTextNode(selectedNodes[0]) && (
				<TextNodePropertiesPanel
					node={selectedNodes[0]}
					key={selectedNodes[0].id}
				/>
			)}
			{isFileNode(selectedNodes[0]) && (
				<FileNodePropertiesPanel
					node={selectedNodes[0]}
					key={selectedNodes[0].id}
				/>
			)}
			{isWebPageNode(selectedNodes[0]) && (
				<WebPageNodePropertiesPanel
					node={selectedNodes[0]}
					key={selectedNodes[0].id}
				/>
			)}
			{isTriggerNode(selectedNodes[0]) && (
				<TriggerNodePropertiesPanel
					node={selectedNodes[0]}
					key={selectedNodes[0].id}
				/>
			)}
			{isActionNode(selectedNodes[0]) && (
				<ActionNodePropertiesPanel
					node={selectedNodes[0]}
					key={selectedNodes[0].id}
				/>
			)}
			{isVectorStoreNode(selectedNodes[0]) && (
				<VectorStoreNodePropertiesPanel
					node={selectedNodes[0]}
					key={selectedNodes[0].id}
				/>
			)}
			{isQueryNode(selectedNodes[0]) && (
				<QueryNodePropertiesPanel
					node={selectedNodes[0]}
					key={selectedNodes[0].id}
				/>
			)}
		</section>
	);
}
