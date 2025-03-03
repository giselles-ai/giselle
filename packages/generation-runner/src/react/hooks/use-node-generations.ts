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
		() => allGenerations.filter((g) => g.context.actionNode.id === nodeId),
		[allGenerations, nodeId],
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
