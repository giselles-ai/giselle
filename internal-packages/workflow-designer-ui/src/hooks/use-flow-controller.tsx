import type { Generation, Workflow } from "@giselle-sdk/data-type";
import type { FlowRunId } from "@giselle-sdk/giselle-engine";
import {
	useGenerationRunnerSystem,
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import { useCallback, useRef } from "react";
import {
	createGenerationsForFlow,
	type FormInput,
} from "../header/ui/trigger-input-dialog/helpers";
import { useToasts } from "../ui/toast";

export function useFlowController() {
	const { createGeneration, startGeneration, stopGeneration } =
		useGenerationRunnerSystem();
	const { data } = useWorkflowDesigner();
	const { info } = useToasts();
	const client = useGiselleEngine();

	const activeGenerationsRef = useRef<Generation[]>([]);
	const cancelRef = useRef(false);

	const stopFlow = useCallback(async () => {
		cancelRef.current = true;
		await Promise.all(
			activeGenerationsRef.current.map((generation) =>
				stopGeneration(generation.id),
			),
		);
	}, [stopGeneration]);

	const patchRunAnnotations = useCallback(
		async (runId: FlowRunId, message: string) => {
			await client.patchRun({
				flowRunId: runId,
				delta: {
					annotations: {
						push: [{ level: "error", message }],
					},
				},
			});
		},
		[client],
	);

	const runOperation = useCallback(
		async (
			runId: FlowRunId,
			operation: Workflow["jobs"][number]["operations"][number],
			generations: Generation[],
			jobStartedAt: number,
		) => {
			const generation = generations.find(
				(g) => g.context.operationNode.id === operation.node.id,
			);
			if (generation === undefined || cancelRef.current) {
				return { duration: 0, hasError: false };
			}
			let hasError = false;
			await startGeneration(generation.id, {
				onGenerationFailed: async (failedGeneration) => {
					hasError = true;
					await patchRunAnnotations(runId, failedGeneration.error.message);
				},
			});
			return { duration: Date.now() - jobStartedAt, hasError };
		},
		[patchRunAnnotations, startGeneration],
	);

	const runJob = useCallback(
		async (
			runId: FlowRunId,
			job: Workflow["jobs"][number],
			jobIndex: number,
			generations: Generation[],
			onComplete?: () => void,
		) => {
			await client.patchRun({
				flowRunId: runId,
				delta: {
					"steps.inProgress": { increment: 1 },
					"steps.queued": { decrement: 1 },
				},
			});

			const jobStartedAt = Date.now();
			let totalTasks = 0;
			let hasJobError = false;
			await Promise.all(
				job.operations.map(async (operation) => {
					const { duration, hasError } = await runOperation(
						runId,
						operation,
						generations,
						jobStartedAt,
					);
					totalTasks += duration;
					if (hasError) {
						hasJobError = true;
					}
				}),
			);

			if (jobIndex === 0 && onComplete) {
				onComplete();
			}

			await client.patchRun({
				flowRunId: runId,
				delta: hasJobError
					? {
							"steps.failed": { increment: 1 },
							"steps.inProgress": { decrement: 1 },
							"duration.totalTask": { increment: totalTasks },
						}
					: {
							"steps.completed": { increment: 1 },
							"steps.inProgress": { decrement: 1 },
							"duration.totalTask": { increment: totalTasks },
						},
			});

			return hasJobError;
		},
		[client, runOperation],
	);

	const finalizeRun = useCallback(
		async (runId: FlowRunId, hasError: boolean, startedAt: number) => {
			await client.patchRun({
				flowRunId: runId,
				delta: {
					status: { set: hasError ? "failed" : "completed" },
					"duration.wallClock": { set: Date.now() - startedAt },
				},
			});
		},
		[client],
	);

	const startFlow = useCallback(
		async (
			flow: Workflow | null,
			inputs: FormInput[],
			values: Record<string, string | number>,
			onComplete?: () => void,
		) => {
			if (flow === null) {
				return;
			}
			const generations = createGenerationsForFlow(
				flow,
				inputs,
				values,
				createGeneration,
				data.id,
			);
			activeGenerationsRef.current = generations;

			cancelRef.current = false;
			info("Workflow submitted successfully", {
				action: (
					<button
						type="button"
						className="relative inline-flex items-center justify-center rounded-lg border-t border-b border-t-white/20 border-b-black/20 px-6 py-2 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.1)] bg-black/20 border border-white/10 shadow-[inset_0_0_4px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.6)]"
						onClick={async () => {
							await stopFlow();
						}}
					>
						Cancel
					</button>
				),
			});

			const { run } = await client.createRun({
				workspaceId: data.id,
				jobsCount: flow.jobs.length,
				trigger: "manual",
			});

			const flowStartedAt = Date.now();
			let hasFlowError = false;

			for (const [jobIndex, job] of flow.jobs.entries()) {
				const jobErrored = await runJob(
					run.id,
					job,
					jobIndex,
					generations,
					onComplete,
				);
				if (jobErrored) {
					hasFlowError = true;
				}
			}

			await finalizeRun(run.id, hasFlowError, flowStartedAt);
		},
		[createGeneration, data.id, info, stopFlow, client, runJob, finalizeRun],
	);

	return { startFlow };
}
