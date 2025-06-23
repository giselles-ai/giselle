import type { Generation, Workflow } from "@giselle-sdk/data-type";
import type { FlowRunId } from "@giselle-sdk/giselle-engine";
import {
	useGenerationRunnerSystem,
	useGiselleEngine,
} from "@giselle-sdk/giselle-engine/react";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback, useRef } from "react";
import {
	type FormInput,
	createGenerationsForFlow,
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
						className="bg-white rounded-[4px] text-black-850 px-[8px] text-[14px] py-[2px] cursor-pointer"
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
