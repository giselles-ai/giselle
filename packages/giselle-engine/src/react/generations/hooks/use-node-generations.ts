import {
	type Generation,
	GenerationOrigin,
	type NodeId,
} from "@giselle-sdk/data-type";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGenerationRunnerSystem } from "../contexts";

/**
 * Hook to fetch and manage node generations.
 * Uses object destructuring with nested destructuring in the parameters to avoid
 * reference equality issues that could cause infinite re-renders.
 * Provides generations filtered by nodeId and origin (id and type), sorted by creation time.
 */
export function useNodeGenerations({
	nodeId,
	origin: { id: originId, type: originType },
}: {
	nodeId: NodeId;
	origin: GenerationOrigin;
}) {
	const {
		generations: allGenerations,
		fetchNodeGenerations,
		startGeneration,
		stopGeneration: stopGenerationSystem,
	} = useGenerationRunnerSystem();

	const [currentGeneration, setCurrentGeneration] = useState<
		Generation | undefined
	>();

	const generations = useMemo(
		() =>
			allGenerations
				.filter(
					(generation) =>
						generation.context.operationNode.id === nodeId &&
						generation.context.origin.type === originType &&
						generation.context.origin.id === originId,
				)
				.sort(
					(a, b) =>
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
				),
		[allGenerations, nodeId, originId, originType],
	);

	// Effect to fetch node generations
	// Using primitive values (originId, originType) in dependencies array instead of the origin object
	// to prevent infinite re-renders caused by new object references
	useEffect(() => {
		const origin = GenerationOrigin.parse({
			id: originId,
			type: originType,
		});
		fetchNodeGenerations({
			nodeId,
			origin,
		});
	}, [fetchNodeGenerations, originId, originType, nodeId]);

	useEffect(() => {
		if (generations.length === 0) {
			setCurrentGeneration(undefined);
		} else {
			// Since generations are sorted by creation time, the last one is the latest
			const latestGeneration = generations[generations.length - 1];
			setCurrentGeneration(latestGeneration);
		}
	}, [generations]);

	const isGenerating = useMemo(() => {
		const latestGeneration = generations[generations.length - 1];
		return (
			latestGeneration?.status === "running" ||
			latestGeneration?.status === "created" ||
			latestGeneration?.status === "queued"
		);
	}, [generations]);

	const stopGeneration = useCallback(() => {
		const latestGeneration = generations[generations.length - 1];
		if (latestGeneration !== undefined) {
			stopGenerationSystem(latestGeneration.id);
		}
	}, [generations, stopGenerationSystem]);

	return {
		generations,
		startGeneration,
		isGenerating,
		currentGeneration,
		stopGeneration,
	};
}
