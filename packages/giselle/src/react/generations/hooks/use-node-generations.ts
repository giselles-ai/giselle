import type { NodeId } from "@giselle-sdk/data-type";
import { useCallback, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useShallow } from "zustand/shallow";
import type {
	Generation,
	GenerationOrigin,
} from "../../../concepts/generation";
import { useFeatureFlag } from "../../feature-flags";
import { useGiselleEngine } from "../../use-giselle-engine";
import { useGenerationRunnerSystem } from "../contexts";
import { useGenerationStore } from "../store";

export function useNodeGenerations({
	nodeId,
	origin,
}: {
	nodeId: NodeId;
	origin: GenerationOrigin;
}) {
	const generations = useGenerationStore(
		useShallow((s) =>
			s.generations.filter(
				(generation) => generation.context.operationNode.id === nodeId,
			),
		),
	);
	const {
		createGenerationRunner,
		startGenerationRunner,
		createAndStartGenerationRunner,
		stopGenerationRunner: stopGenerationSystem,
		addGenerationRunner,
	} = useGenerationRunnerSystem();
	const client = useGiselleEngine();

	/** @todo fetch on server */
	const { data, isLoading } = useSWR(
		{
			api: "node-generations",
			origin,
			nodeId,
		},
		(args) => client.getNodeGenerations(args),
		{
			revalidateIfStale: false,
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
		},
	);

	useEffect(() => {
		if (isLoading || data === undefined) {
			return;
		}
		if (data.length === 0) {
			return;
		}
		addGenerationRunner(
			data.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			)[0],
		);
	}, [isLoading, data, addGenerationRunner]);

	const currentGeneration = useMemo<Generation>(() => {
		const filteredGenerations = generations
			.filter(
				(generation) =>
					generation.status !== "cancelled" &&
					generation.context.operationNode.id === nodeId &&
					generation.context.origin.type === origin.type &&
					(origin.type === "studio"
						? generation.context.origin.type === "studio" &&
							generation.context.origin.workspaceId === origin.workspaceId
						: generation.context.origin.type !== "studio" &&
							generation.context.origin.actId === origin.actId),
			)
			.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		return filteredGenerations[0];
	}, [generations, nodeId, origin]);

	const isGenerating = useMemo(
		() =>
			currentGeneration?.status === "running" ||
			currentGeneration?.status === "created" ||
			currentGeneration?.status === "queued",
		[currentGeneration],
	);

	const stopGenerationRunner = useCallback(() => {
		if (currentGeneration === undefined) {
			return;
		}
		stopGenerationSystem(currentGeneration.id);
	}, [currentGeneration, stopGenerationSystem]);

	return {
		createGenerationRunner,
		startGenerationRunner,
		createAndStartGenerationRunner,
		isGenerating,
		currentGeneration,
		stopGenerationRunner,
	};
}
