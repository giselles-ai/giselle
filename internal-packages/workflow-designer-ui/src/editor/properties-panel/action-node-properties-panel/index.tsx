import type { ActionNode, Node } from "@giselles-ai/protocol";
import { useNodeGenerations } from "@giselles-ai/react";
import { useCallback } from "react";
import {
	useAppDesignerStore,
	useWorkspaceActions,
} from "../../../app-designer";
import {
	useDeleteNode,
	useUpdateNodeData,
} from "../../../app-designer";
import { PropertiesPanelContent, PropertiesPanelRoot } from "../ui";
import { NodePanelHeader } from "../ui/node-panel-header";
import { GitHubActionPropertiesPanel } from "./github-action-properties-panel";
import { useConnectedInputs } from "./lib";

export function ActionNodePropertiesPanel({ node }: { node: ActionNode }) {
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const connections = useAppDesignerStore((s) => s.connections);
	const updateNodeData = useUpdateNodeData();
	const deleteNode = useDeleteNode();
	const setUiNodeState = useWorkspaceActions((a) => a.setUiNodeState);
	const { isValid, connectedInputs } = useConnectedInputs(node.id, node.inputs);
	const { createAndStartGenerationRunner, isGenerating, stopGenerationRunner } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "studio", workspaceId },
		});
	const handleClick = useCallback(() => {
		if (isGenerating) {
			stopGenerationRunner();
			return;
		}

		if (!isValid) {
			setUiNodeState(node.id, {
				showError: true,
			});
			return;
		}

		setUiNodeState(node.id, {
			showError: false,
		});
		createAndStartGenerationRunner({
			origin: {
				type: "studio",
				workspaceId,
			},
			operationNode: node,
			sourceNodes: connectedInputs
				.map((input) => input.connectedOutput?.node as Node)
				.filter((node) => node !== null),
			connections: connections.filter(
				(connection) => connection.inputNode.id === node.id,
			),
		});
	}, [
		isGenerating,
		stopGenerationRunner,
		isValid,
		setUiNodeState,
		node,
		connections,
		createAndStartGenerationRunner,
		connectedInputs,
		workspaceId,
	]);
	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/action-node"
				onDelete={() => deleteNode(node.id)}
			/>
			<PropertiesPanelContent>
				<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative">
					<PropertiesPanel
						node={node}
						handleClick={handleClick}
						isGenerating={isGenerating}
					/>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}

function PropertiesPanel({
	node,
	handleClick,
	isGenerating,
}: {
	node: ActionNode;
	handleClick: () => void;
	isGenerating: boolean;
}) {
	switch (node.content.command.provider) {
		case "github":
			return (
				<GitHubActionPropertiesPanel
					node={node}
					handleClick={handleClick}
					isGenerating={isGenerating}
				/>
			);
		default: {
			// TODO: Uncomment after implementing WebSearchActionPropertiesPanel
			// const _exhaustiveCheck: never = node.content.command.provider;
			// throw new Error(`Unhandled action provider: ${_exhaustiveCheck}`);
			const unknownProvider = (node.content.command as { provider: string })
				.provider;
			throw new Error(`Unhandled action provider: ${unknownProvider}`);
		}
	}
}
