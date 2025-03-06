import {
	type CancelledRun,
	type CreatedRun,
	type Generation,
	type Run,
	RunId,
	type RunningRun,
	type WorkflowId,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import { useGenerationRunnerSystem } from "@giselle-sdk/generation-runner/react";
import { useGiselleEngine } from "@giselle-sdk/giselle-engine/react";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";

export interface performOptions {
	onCreateRun?: (run: CreatedRun) => void;
}
export type Perform = (
	workflowId: WorkflowId,
	options?: performOptions,
) => Promise<void>;
export type Cancel = (runId: RunId) => Promise<void>;

interface RunSystemContextType {
	runs: Run[];
	activeRunId?: RunId;
	runGenerations: Record<RunId, Generation[]>;
	perform: Perform;
	isRunning: boolean;
	cancel: Cancel;
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
	const client = useGiselleEngine();
	const [activeRunId, setActiveRunId] = useState<RunId | undefined>();
	const [runs, setRuns] = useState<Run[]>([]);
	const [isRunning, setIsRunning] = useState(false);
	const { startGeneration, stopGeneration } = useGenerationRunnerSystem();
	const [runGenerations, setRunGenerations] = useState<
		Record<RunId, Generation[]>
	>({});
	const runRef = useRef<Record<RunId, Run>>({});

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
			runRef.current[runId] = createdRun;
			options?.onCreateRun?.(createdRun);
			setActiveRunId(createdRun.id);
			const queuedRun = await client.addRun({
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
			runRef.current[runId] = runningRun;
			await client.startRun({
				runId,
			});

			for (const job of runningRun.workflow.jobs) {
				await Promise.all(
					job.actions.map(async (action) => {
						const currentRun = runRef.current[runId];
						if (currentRun === undefined) {
							return;
						}
						if (currentRun.status === "cancelled") {
							return;
						}
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
								onUpdateMessages(generation) {
									setRunGeneration(runId, generation);
								},
								onGenerationCancelled(generation) {
									setRunGeneration(runId, generation);
								},
							},
						);
					}),
				);
			}
			setIsRunning(false);
		},
		[workspaceId, setRunGeneration, startGeneration, client],
	);

	const cancel = useCallback<Cancel>(
		async (runId) => {
			const generations = runGenerations[runId] || [];

			const currentRun = runRef.current[runId];
			if (currentRun === undefined) {
				return;
			}
			const cancelledRun = {
				...currentRun,
				status: "cancelled",
				cancelledAt: Date.now(),
			} as CancelledRun;

			setRuns((prev) => [...prev.filter((p) => p.id !== runId), cancelledRun]);
			runRef.current[runId] = cancelledRun;

			setIsRunning(false);
			await Promise.all(
				generations.map(async (generation) => {
					if (
						generation.status === "running" ||
						generation.status === "queued" ||
						generation.status === "created"
					) {
						try {
							await stopGeneration(generation.id);
						} catch (error) {
							console.error(
								`Failed to stop generation ${generation.id}:`,
								error,
							);
						}
					}
				}),
			);
		},
		[runGenerations, stopGeneration],
	);

	return (
		<RunSystemContext.Provider
			value={{
				runs,
				activeRunId,
				runGenerations,
				perform,
				isRunning,
				cancel,
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
