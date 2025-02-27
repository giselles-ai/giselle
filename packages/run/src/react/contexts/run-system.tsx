import type { WorkflowId, WorkspaceId } from "@giselle-sdk/data-type";
import {
	type CreatedRun,
	type Generation,
	type Run,
	RunId,
	type RunningRun,
} from "@giselle-sdk/data-type";
import { useGenerationController } from "@giselle-sdk/generation-runner/react";
import {
	callAddRunApi,
	callStartRunApi,
} from "@giselle-sdk/giselle-engine/client";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useState,
} from "react";

export interface performOptions {
	onCreateRun?: (run: CreatedRun) => void;
}
export type Perform = (
	workflowId: WorkflowId,
	options?: performOptions,
) => Promise<void>;

interface RunSystemContextType {
	runs: Run[];
	activeRunId?: RunId;
	runGenerations: Record<RunId, Generation[]>;
	perform: Perform;
	isRunning: boolean;
}

export const RunSystemContext = createContext<RunSystemContextType | undefined>(
	undefined,
);

export function RunSystemContextProvider({
	workspaceId,
	children,
}: {
	workspaceId: WorkspaceId;
	children: ReactNode;
}) {
	const [activeRunId, setActiveRunId] = useState<RunId | undefined>();
	const [runs, setRuns] = useState<Run[]>([]);
	const [isRunning, setIsRunning] = useState(false);
	const { startGeneration } = useGenerationController();
	const [runGenerations, setRunGenerations] = useState<
		Record<RunId, Generation[]>
	>({});
	const setRunGeneration = useCallback(
		(runId: RunId, newGeneration: Generation) => {
			setRunGenerations((prev) => {
				const newRunGenerations: Record<RunId, Generation[]> = {};
				let found = false;
				for (const [prevRunId, prevGenerations] of Object.entries(prev)) {
					if (prevRunId === runId) {
						found = true;
						newRunGenerations[prevRunId] = [
							...prevGenerations.filter(
								(prevGeneration) => prevGeneration.id !== newGeneration.id,
							),
							newGeneration,
						];
						continue;
					}
					newRunGenerations[prevRunId as RunId] = prevGenerations;
				}
				if (!found) {
					newRunGenerations[runId] = [newGeneration];
				}
				return newRunGenerations;
			});
		},
		[],
	);

	const perform = useCallback<Perform>(
		async (workflowId, options) => {
			setIsRunning(true);
			const runId = RunId.generate();
			const createdRun = {
				id: runId,
				status: "created",
				createdAt: Date.now(),
			} satisfies CreatedRun;
			setRuns((prev) => [...prev, createdRun]);
			options?.onCreateRun?.(createdRun);
			setActiveRunId(createdRun.id);
			const { run: queuedRun } = await callAddRunApi({
				run: createdRun,
				workspaceId,
				workflowId,
			});
			const runningRun = {
				...queuedRun,
				status: "running",
				startedAt: Date.now(),
			} satisfies RunningRun;
			setRuns((prev) => [...prev.filter((p) => p.id !== runId), runningRun]);
			await callStartRunApi({
				runId,
			});

			for (const job of runningRun.workflow.jobs) {
				await Promise.all(
					job.actions.map(async (action) => {
						await startGeneration(
							{
								origin: { type: "run", id: runId },
								...action.generationTemplate,
							},
							{
								onGenerationCreated(generation) {
									setRunGeneration(runId, generation);
								},
								onGenerationQueued(generation) {
									setRunGeneration(runId, generation);
								},
								onGenerationStarted(generation) {
									setRunGeneration(runId, generation);
								},
								onGenerationCompleted(generation) {
									setRunGeneration(runId, generation);
								},
							},
						);
					}),
				);
			}
			setIsRunning(false);
		},
		[workspaceId, setRunGeneration, startGeneration],
	);

	return (
		<RunSystemContext.Provider
			value={{
				runs,
				activeRunId,
				runGenerations,
				perform,
				isRunning,
			}}
		>
			{children}
		</RunSystemContext.Provider>
	);
}

export function useRunSystem() {
	const context = useContext(RunSystemContext);
	if (!context) {
		throw new Error("useRunSystem must be used within a RunSystemProvider");
	}
	return context;
}
