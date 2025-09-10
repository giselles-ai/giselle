import type { NodeId } from "@giselle-sdk/data-type";
import { useCallback, useMemo } from "react";
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
	} = useGenerationRunnerSystem();
	const client = useGiselleEngine();
	const { experimental_storage } = useFeatureFlag();

	/** @todo fetch on server */
	const { data } = useSWR(
		{
			api: "node-generations",
			origin,
			nodeId,
			useExperimentalStorage: experimental_storage,
		},
		(args) => client.getNodeGenerations(args),
		{
			revalidateIfStale: false,
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
		},
	);
	const currentGeneration = useMemo<Generation>(() => {
		const fetchGenerations = data ?? [];
		const createdGenerations = generations.filter(
			(generation) =>
				generation.context.operationNode.id === nodeId &&
				generation.context.origin.type === origin.type &&
				(origin.type === "studio"
					? generation.context.origin.type === "studio" &&
						generation.context.origin.workspaceId === origin.workspaceId
					: generation.context.origin.type !== "studio" &&
						generation.context.origin.actId === origin.actId),
		);
		// Deduplicate generations by filtering out fetched generations from created ones
		const deduplicatedCreatedGenerations = createdGenerations.filter(
			(created) =>
				!fetchGenerations.some((fetched) => fetched.id === created.id),
		);
		// Filter out cancelled generations from both sources after deduplication
		const allGenerations = [
			...fetchGenerations,
			...deduplicatedCreatedGenerations,
		]
			.filter((generation) => generation.status !== "cancelled")
			.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		return allGenerations[0];
	}, [generations, data, nodeId, origin]);

	const isGenerating = useMemo(
		() =>
			currentGeneration?.status === "running" ||
			currentGeneration?.status === "created" ||
			currentGeneration?.status === "queued",
		[currentGeneration],
	);

	const stopGenerationRunner = useCallback(() => {
		if (currentGeneration !== undefined) {
			stopGenerationSystem(currentGeneration.id);
		}
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
