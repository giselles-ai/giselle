import type { Node, OperationNode } from "@giselle-sdk/data-type";
import { useNodeGenerations, useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback } from "react";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import { useToasts } from "../../../ui/toast";

export interface NodeGenerationConfig<T extends OperationNode> {
	node: T;
	getConnectedSources: (node: T) => { node: Node }[];
	validateGeneration?: (node: T) => boolean;
	onValidationError?: (node: T) => void;
	usageLimitErrorMessage?: string;
}

export function useNodeGeneration<T extends OperationNode>({
	node,
	getConnectedSources,
	validateGeneration,
	onValidationError,
	usageLimitErrorMessage = "Please upgrade your plan to continue using this feature.",
}: NodeGenerationConfig<T>) {
	const { data, setUiNodeState } = useWorkflowDesigner();
	const { createAndStartGeneration, isGenerating, stopGeneration } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "workspace", id: data.id },
		});
	const usageLimitsReached = useUsageLimitsReached();
	const { error } = useToasts();

	const handleGenerate = useCallback(() => {
		// Check usage limits
		if (usageLimitsReached) {
			error(usageLimitErrorMessage);
			return;
		}

		// Custom validation if provided
		if (validateGeneration && !validateGeneration(node)) {
			onValidationError?.(node);
			setUiNodeState(node.id, { showError: true });
			return;
		}

		// Clear any previous errors
		setUiNodeState(node.id, { showError: false });

		// Get connected sources
		const connectedSources = getConnectedSources(node);

		// Start generation
		createAndStartGeneration({
			origin: {
				type: "workspace",
				id: data.id,
			},
			operationNode: node,
			sourceNodes: connectedSources.map((source) => source.node),
			connections: data.connections.filter(
				(connection) => connection.inputNode.id === node.id,
			),
		});
	}, [
		usageLimitsReached,
		error,
		usageLimitErrorMessage,
		validateGeneration,
		node,
		onValidationError,
		setUiNodeState,
		getConnectedSources,
		createAndStartGeneration,
		data.id,
		data.connections,
	]);

	const handleStop = useCallback(() => {
		stopGeneration();
	}, [stopGeneration]);

	return {
		isGenerating,
		handleGenerate,
		handleStop,
		disabled: usageLimitsReached,
	};
}
