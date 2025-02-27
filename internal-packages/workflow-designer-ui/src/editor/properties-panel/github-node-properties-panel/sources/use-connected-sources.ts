import type {
	ActionNode,
	GitHubNode,
	VariableNode,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useMemo } from "react";
import type { ConnectedSource } from "./types";

export function useConnectedSources(node: GitHubNode) {
	const { data } = useWorkflowDesigner();
	return useMemo(() => {
		const connectionsToThisNode = data.connections.filter(
			(connection) => connection.inputNodeId === node.id,
		);
		const connectedGeneratedSources: ConnectedSource<ActionNode>[] = [];
		const connectedVariableSources: ConnectedSource<VariableNode>[] = [];

		for (const connection of connectionsToThisNode) {
			const sourceNode = data.nodes.find(
				(node) => node.id === connection.outputNodeId,
			);
			if (sourceNode === undefined) {
				continue;
			}
			const output = sourceNode.outputs.find(
				(output) => output.id === connection.outputId,
			);
			if (output === undefined) {
				continue;
			}

			switch (sourceNode.type) {
				case "action":
					connectedGeneratedSources.push({
						output,
						node: sourceNode,
						connection,
					});
					break;
				case "variable":
					connectedVariableSources.push({
						output,
						node: sourceNode,
						connection,
					});
					break;
			}
		}

		const all = [...connectedGeneratedSources, ...connectedVariableSources];

		return {
			all,
			generation: connectedGeneratedSources,
			variable: connectedVariableSources,
			// Keep backward compatibility
			connected: all,
			unconnected: [],
		};
	}, [node.id, data.connections, data.nodes]);
}
