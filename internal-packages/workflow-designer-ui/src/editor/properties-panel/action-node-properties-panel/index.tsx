import type { ActionNode, Node } from "@giselle-sdk/data-type";
import { useNodeGenerations, useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback } from "react";
import { NodeIcon } from "../../../icons/node";
import { Button } from "../../../ui/button";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { FetchActionPropertiesPanel } from "./fetch-action-properties-panel";
import { GitHubActionPropertiesPanel } from "./github-action-properties-panel";
import { useConnectedInputs } from "./lib";

export function ActionNodePropertiesPanel({
	node,
}: {
	node: ActionNode;
}) {
	const { data, updateNodeData, setUiNodeState } = useWorkflowDesigner();
	const { isValid, connectedInputs } = useConnectedInputs(node.id, node.inputs);
	const { createAndStartGeneration, isGenerating, stopGeneration } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "workspace", id: data.id },
		});
	const handleClick = useCallback(async () => {
		if (!isValid) {
			setUiNodeState(node.id, {
				showError: true,
			});
			return;
		}

		setUiNodeState(node.id, {
			showError: false,
		});
		createAndStartGeneration({
			origin: {
				type: "workspace",
				id: data.id,
			},
			operationNode: node,
			sourceNodes: connectedInputs
				.map((input) => input.connectedOutput?.node as Node)
				.filter((node) => node !== null),
		});
	}, [
		isValid,
		setUiNodeState,
		node,
		data.id,
		createAndStartGeneration,
		connectedInputs,
	]);
	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<NodeIcon node={node} className="size-[20px] text-black-900" />}
				node={node}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				action={
					node.content.command.state.status === "unconfigured" ? null : (
						<Button type="button" onClick={handleClick}>
							Action
						</Button>
					)
				}
			/>
			<PropertiesPanelContent>
				<PropertiesPanel node={node} />
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}

function PropertiesPanel({
	node,
}: {
	node: ActionNode;
}) {
	switch (node.content.command.provider) {
		case "github":
			return <GitHubActionPropertiesPanel node={node} />;
		case "fetch":
			return <FetchActionPropertiesPanel node={node} />;
		default: {
			const _exhaustiveCheck: never = node.content.command.provider;
			throw new Error(`Unhandled action provider: ${_exhaustiveCheck}`);
		}
	}
}
