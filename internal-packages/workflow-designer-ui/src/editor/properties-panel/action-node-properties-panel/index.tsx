import { IconBox } from "@giselle-internal/ui/icon-box";
import type { ActionNode, Node } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import { Trash2 as TrashIcon } from "lucide-react";
import { useCallback } from "react";
import { Button } from "../../../ui/button";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { GitHubActionPropertiesPanel } from "./github-action-properties-panel";
import { useConnectedInputs } from "./lib";

export function ActionNodePropertiesPanel({ node }: { node: ActionNode }) {
	const { data, updateNodeData, setUiNodeState, deleteNode } =
		useWorkflowDesigner();
	const { isValid, connectedInputs } = useConnectedInputs(node.id, node.inputs);
	const { createAndStartGenerationRunner } = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "studio", workspaceId: data.id },
	});
	const handleClick = useCallback(() => {
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
				workspaceId: data.id,
			},
			operationNode: node,
			sourceNodes: connectedInputs
				.map((input) => input.connectedOutput?.node as Node)
				.filter((node) => node !== null),
			connections: data.connections.filter(
				(connection) => connection.inputNode.id === node.id,
			),
		});
	}, [
		isValid,
		setUiNodeState,
		node,
		data.id,
		data.connections,
		createAndStartGenerationRunner,
		connectedInputs,
	]);
	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				node={node}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				action={
					<div className="flex items-center gap-[6px] ml-[8px]">
						{node.content.command.state.status === "unconfigured" ? null : (
							<Button type="button" onClick={handleClick}>
								Run Action
							</Button>
						)}
						<IconBox
							aria-label="Open documentation"
							title="Open documentation"
							onClick={() =>
								window.open(
									"https://docs.giselles.ai/en/glossary/github-action-node",
									"_blank",
									"noopener,noreferrer",
								)
							}
						>
							<svg
								className="size-[14px]"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								role="img"
								aria-label="External link"
							>
								<path
									d="M14 3h7v7m0-7L10 14"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</IconBox>
						<IconBox
							aria-label="Delete node"
							title="Delete node"
							onClick={() => deleteNode(node.id)}
						>
							<TrashIcon className="size-[14px]" />
						</IconBox>
					</div>
				}
			/>
			<PropertiesPanelContent>
				<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative">
					<PropertiesPanel node={node} />
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}

function PropertiesPanel({ node }: { node: ActionNode }) {
	switch (node.content.command.provider) {
		case "github":
			return <GitHubActionPropertiesPanel node={node} />;
		case "web-search":
			// TODO: Implement WebSearchActionPropertiesPanel
			return <div>Web Search Action (Coming Soon)</div>;
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
