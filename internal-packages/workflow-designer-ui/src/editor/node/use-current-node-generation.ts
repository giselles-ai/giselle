import type { NodeId } from "@giselles-ai/protocol";
import {
	useGenerationRunnerSystem,
	useGenerationStore,
} from "@giselles-ai/react";
import { useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { useAppDesignerStore } from "../../app-designer";

export function useCurrentNodeGeneration(nodeId: NodeId) {
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
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
