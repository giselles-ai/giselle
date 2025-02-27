import {
	isFileNode,
	isGitHubNode,
	isTextGenerationNode,
	isTextNode,
} from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useMemo } from "react";
import { FileNodePropertiesPanel } from "./file-node-properties-panel";
import { GitHubNodePropertiesPanel } from "./github-node-properties-panel";
import { TextGenerationNodePropertiesPanel } from "./text-generation-node-properties-panel";
import { TextNodePropertiesPanel } from "./text-node-properties-panel";

export function PropertiesPanel() {
	const { data } = useWorkflowDesigner();
	const selectedNodes = useMemo(
		() =>
			Object.entries(data.ui.nodeState)
				.filter(([_, nodeState]) => nodeState?.selected)
				.map(([nodeId]) => data.nodes.find((node) => node.id === nodeId))
				.filter((node) => node !== undefined),
		[data],
	);
	return (
		<div className={clsx("h-full text-white-900")}>
			<>
				{isTextGenerationNode(selectedNodes[0]) && (
					<TextGenerationNodePropertiesPanel
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
				{isGitHubNode(selectedNodes[0]) && (
					<GitHubNodePropertiesPanel
						node={selectedNodes[0]}
						key={selectedNodes[0].id}
					/>
				)}
			</>
		</div>
	);
}
