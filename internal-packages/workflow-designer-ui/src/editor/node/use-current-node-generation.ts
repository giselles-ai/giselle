import type { NodeId } from "@giselle-sdk/data-type";
import {
	useGenerationRunnerSystem,
	useGenerationStore,
	useWorkflowDesignerStore,
} from "@giselle-sdk/giselle/react";
import { useCallback } from "react";
import { useShallow } from "zustand/shallow";

export function useCurrentNodeGeneration(nodeId: NodeId) {
	const workspaceId = useWorkflowDesignerStore((state) => state.workspace.id);
	const { stopGenerationRunner } = useGenerationRunnerSystem();
	const currentGeneration = useGenerationStore(
		useShallow((s) => {
			const generation = s.generations
				.sort((a, b) => b.createdAt - a.createdAt)
				.find(
					(generation) =>
						generation.context.operationNode.id === nodeId &&
						generation.context.origin.type === "studio" &&
						generation.context.origin.workspaceId === workspaceId,
				);
			if (generation === undefined) {
				return undefined;
			}
			return {
				id: generation.id,
				status: generation.status,
			};
		}),
	);
	const stopCurrentGeneration = useCallback(() => {
		if (currentGeneration?.id === undefined) {
			return;
		}
		stopGenerationRunner(currentGeneration.id);
	}, [stopGenerationRunner, currentGeneration?.id]);
	return { currentGeneration, stopCurrentGeneration };
}
