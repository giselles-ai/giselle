import type { ActExecutorOptions, CreateActInputs } from "@giselles-ai/giselle";
import type {
	NodeGenerationIndex,
	TaskId,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { useCallback, useEffect } from "react";
import useSWR from "swr";
import { useShallow } from "zustand/shallow";
import { useGenerationRunnerSystem } from "../generations";
import { useGiselle } from "../use-giselle";
import { useActStore } from "./store";

type CreateAndStartActParams = Omit<
	CreateActInputs,
	"generationOriginType" | "workspace" | "workspaceId"
> &
	Omit<
		ActExecutorOptions,
		| "act"
		| "applyPatches"
		| "generationAdapter"
		| "onActStart"
		| "onActComplete"
		| "startGeneration"
	> & {
		onActStart?: (options: {
			cancel: () => Promise<void>;
			actId: string;
		}) => void | Promise<void>;
		onActComplete?: (options: {
			hasError: boolean;
			duration: number;
			actId: string;
		}) => void | Promise<void>;
	};

export function useActSystem(workspaceId: WorkspaceId) {
	const client = useGiselle();
	const { data, isLoading } = useSWR(
		{ namespace: "get-workspace-inprogress-act", workspaceId },
		({ workspaceId }) => client.getWorkspaceInprogressAct({ workspaceId }),
	);
	const { addGenerationRunner, stopGenerationRunner } =
		useGenerationRunnerSystem();
	const { creating } = useActStore(
		useShallow((s) => ({
			activeAct: s.activeAct,
			creating: s.creating,
		})),
	);
	const setActiveAct = useActStore((s) => s.setActiveAct);
	const setCreating = useActStore((s) => s.setCreating);

	const pollingActGenerations = useCallback(
		async (actId: TaskId) => {
			let didActFinished = false;
			const prevGenerationIndexMap = new Map<string, NodeGenerationIndex>();
			while (!didActFinished) {
				const { act, generationIndexes } = await client.getActGenerationIndexes(
					{
						actId,
					},
				);
				const changedGenerationIndexes =
					generationIndexes?.filter((nextGenerationIndex) => {
						const prev = prevGenerationIndexMap.get(nextGenerationIndex.id);
						return (
							prev === undefined || prev.status !== nextGenerationIndex.status
						);
					}) ?? [];
				const changedGenerations = await Promise.all(
					changedGenerationIndexes.map((changedGeneration) =>
						client.getGeneration({
							generationId: changedGeneration.id,
						}),
					),
				).then((nullableData) =>
					nullableData.filter((data) => data !== undefined),
				);
				addGenerationRunner(changedGenerations);

				for (const changed of changedGenerationIndexes) {
					prevGenerationIndexMap.set(changed.id, changed);
				}

				if (
					act.status === "completed" ||
					act.status === "failed" ||
					act.status === "cancelled"
				) {
					didActFinished = true;
				}

				await new Promise((resolve) => setTimeout(resolve, 1000 * 5));
			}
		},
		[client, addGenerationRunner],
	);

	useEffect(() => {
		if (isLoading) {
			return;
		}
		setActiveAct(data?.act);
		if (data?.act !== undefined) {
			pollingActGenerations(data.act.id);
		}
	}, [data, isLoading, setActiveAct, pollingActGenerations]);

	const createAndStartAct = useCallback(
		async ({
			connectionIds,
			nodeId,
			inputs,
			onActStart,
		}: CreateAndStartActParams) => {
			setCreating(true);
			const { act, generations } = await client.createAct({
				connectionIds,
				nodeId,
				workspaceId,
				generationOriginType: "studio",
				inputs,
			});

			setActiveAct(act);
			addGenerationRunner(generations);
			onActStart?.({
				cancel: async () => {
					await Promise.all(
						generations.map((generation) =>
							stopGenerationRunner(generation.id),
						),
					);
				},
				actId: act.id,
			});
			await client.startAct({
				actId: act.id,
				generationOriginType: "studio",
			});
			setCreating(false);
			await pollingActGenerations(act.id);
		},
		[
			setCreating,
			workspaceId,
			client,
			addGenerationRunner,
			pollingActGenerations,
			setActiveAct,
			stopGenerationRunner,
		],
	);
	return {
		creating,
		createAndStartAct,
	};
}
