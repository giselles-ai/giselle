import type {
	CreateTaskInputs,
	TaskExecutorOptions,
} from "@giselles-ai/giselle";
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
import { useTaskStore } from "./store";

type CreateAndStartTaskParams = Omit<
	CreateTaskInputs,
	"generationOriginType" | "workspace" | "workspaceId"
> &
	Omit<
		TaskExecutorOptions,
		| "task"
		| "applyPatches"
		| "generationAdapter"
		| "onTaskStart"
		| "onTaskComplete"
		| "startGeneration"
	> & {
		onTaskStart?: (options: {
			cancel: () => Promise<void>;
			taskId: string;
		}) => void | Promise<void>;
		onTaskComplete?: (options: {
			hasError: boolean;
			duration: number;
			taskId: string;
		}) => void | Promise<void>;
	};

export function useTaskSystem(workspaceId: WorkspaceId) {
	const client = useGiselle();
	const { data, isLoading } = useSWR(
		{ namespace: "get-workspace-inprogress-task", workspaceId },
		({ workspaceId }) => client.getWorkspaceInprogressTask({ workspaceId }),
	);
	const { addGenerationRunner, stopGenerationRunner } =
		useGenerationRunnerSystem();
	const { creating } = useTaskStore(
		useShallow((s) => ({
			activeTask: s.activeTask,
			creating: s.creating,
		})),
	);
	const setActiveTask = useTaskStore((s) => s.setActiveTask);
	const setCreating = useTaskStore((s) => s.setCreating);

	const pollingTaskGenerations = useCallback(
		async (taskId: TaskId) => {
			let didTaskFinished = false;
			const prevGenerationIndexMap = new Map<string, NodeGenerationIndex>();
			while (!didTaskFinished) {
				const { task, generationIndexes } =
					await client.getTaskGenerationIndexes({
						taskId,
					});
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
					task.status === "completed" ||
					task.status === "failed" ||
					task.status === "cancelled"
				) {
					didTaskFinished = true;
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
		setActiveTask(data?.task);
		if (data?.task !== undefined) {
			pollingTaskGenerations(data.task.id);
		}
	}, [data, isLoading, setActiveTask, pollingTaskGenerations]);

	const createAndStartTask = useCallback(
		async ({
			connectionIds,
			nodeId,
			inputs,
			onTaskStart,
		}: CreateAndStartTaskParams) => {
			setCreating(true);
			const { task, generations } = await client.createTask({
				connectionIds,
				nodeId,
				workspaceId,
				generationOriginType: "studio",
				inputs,
			});
			console.dir(task, { depth: null });
			console.dir(generations, { depth: null });

			setActiveTask(task);
			addGenerationRunner(generations);
			onTaskStart?.({
				cancel: async () => {
					await Promise.all(
						generations.map((generation) =>
							stopGenerationRunner(generation.id),
						),
					);
				},
				taskId: task.id,
			});
			await client.startTask({
				taskId: task.id,
				generationOriginType: "studio",
			});
			setCreating(false);
			await pollingTaskGenerations(task.id);
		},
		[
			setCreating,
			workspaceId,
			client,
			addGenerationRunner,
			pollingTaskGenerations,
			setActiveTask,
			stopGenerationRunner,
		],
	);
	return {
		creating,
		createAndStartTask,
	};
}
