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

	const runStep = useCallback(
		async (
			runId: FlowRunId,
			step: Workflow["sequences"][number]["steps"][number],
			generations: Generation[],
			sequenceStartedAt: number,
		) => {
			const generation = generations.find(
				(g) => g.context.operationNode.id === step.node.id,
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
			return { duration: Date.now() - sequenceStartedAt, hasError };
		},
		[patchRunAnnotations, startGeneration],
	);

	const runSequence = useCallback(
		async (
			runId: FlowRunId,
			sequence: Workflow["sequences"][number],
			sequenceIndex: number,
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

			const sequenceStartedAt = Date.now();
			let totalTasks = 0;
			let hasSequenceError = false;
			await Promise.all(
				sequence.steps.map(async (step) => {
					const { duration, hasError } = await runStep(
						runId,
						step,
						generations,
						sequenceStartedAt,
					);
					totalTasks += duration;
					if (hasError) {
						hasSequenceError = true;
					}
				}),
			);

			if (sequenceIndex === 0 && onComplete) {
				onComplete();
			}

			await client.patchRun({
				flowRunId: runId,
				delta: hasSequenceError
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

			return hasSequenceError;
		},
		[client, runStep],
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
				jobsCount: flow.sequences.length,
				trigger: "manual",
			});

			const flowStartedAt = Date.now();
			let hasFlowError = false;

			for (const [sequenceIndex, sequence] of flow.sequences.entries()) {
				const sequenceErrored = await runSequence(
					run.id,
					sequence,
					sequenceIndex,
					generations,
					onComplete,
				);
				if (sequenceErrored) {
					hasFlowError = true;
				}
			}

			await finalizeRun(run.id, hasFlowError, flowStartedAt);
		},
		[
			createGeneration,
			data.id,
			info,
			stopFlow,
			client,
			runSequence,
			finalizeRun,
		],
	);

	return { startFlow };
}
