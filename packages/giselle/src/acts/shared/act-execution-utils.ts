import type {
	Generation,
	GenerationId,
	GenerationStatus,
	Sequence,
	Step,
	Task,
	TaskId,
} from "@giselles-ai/protocol";
import { patches } from "../object/patch-creators";
import type { Patch } from "../object/patch-object";

// Valid status transitions for acts
const VALID_ACT_TRANSITIONS: Record<Task["status"], Task["status"][]> = {
	created: ["inProgress"],
	inProgress: ["completed", "failed", "cancelled"],
	completed: [],
	failed: [],
	cancelled: [],
};

// Valid status transitions for sequences and steps
const VALID_GENERATION_TRANSITIONS: Record<
	GenerationStatus,
	GenerationStatus[]
> = {
	created: ["queued", "cancelled"],
	queued: ["running", "cancelled"],
	running: ["completed", "failed", "cancelled"],
	completed: [],
	failed: [],
	cancelled: [],
};

export function isValidActTransition(
	from: Task["status"],
	to: Task["status"],
): boolean {
	return VALID_ACT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isValidGenerationTransition(
	from: GenerationStatus,
	to: GenerationStatus,
): boolean {
	return VALID_GENERATION_TRANSITIONS[from]?.includes(to) ?? false;
}

interface SequenceExecutionOptions {
	sequence: Sequence;
	startGeneration(
		generationId: GenerationId,
		callbacks?: {
			onCompleted?: () => void | Promise<void>;
			onFailed?: (generation: Generation) => void | Promise<void>;
		},
	): Promise<void>;
	onSequenceStart?: (sequence: Sequence) => void | Promise<void>;
	onSequenceComplete?: (sequence: Sequence) => void | Promise<void>;
	onSequenceError?: (
		error: unknown,
		sequence: Sequence,
	) => void | Promise<void>;
	onStepStart?: (step: Step, stepIndex: number) => Promise<void>;
	onStepError?: (
		step: Step,
		stepIndex: number,
		error: unknown,
	) => Promise<void>;
	onStepComplete?: (step: Step, stepIndex: number) => Promise<void>;
}

async function executeSequence({
	sequence,
	...options
}: SequenceExecutionOptions): Promise<{
	hasError: boolean;
	totalTaskDuration: number;
	wallClockDuration: number;
}> {
	const startTime = Date.now();
	let totalTaskDuration = 0;
	let hasError = false;

	// Start sequence
	sequence.status = "running";
	await options.onSequenceStart?.(sequence);

	// Execute all steps in parallel
	const executedSteps = await Promise.all(
		sequence.steps.map(async (step, stepIndex) => {
			const stepStartTime = Date.now();

			try {
				step.status = "running";
				await options.onStepStart?.(step, stepIndex);

				await options.startGeneration(step.generationId, {
					onCompleted: async () => {
						const duration = Date.now() - stepStartTime;
						totalTaskDuration += duration;
						step.status = "completed";
						step.duration = duration;
						await options.onStepComplete?.(step, stepIndex);
					},
					onFailed: async (failedGeneration) => {
						hasError = true;
						const duration = Date.now() - stepStartTime;
						totalTaskDuration += duration;
						await options.onStepError?.(
							{ ...step, duration, status: "failed" },
							stepIndex,
							failedGeneration,
						);
					},
				});
			} catch (error) {
				hasError = true;
				const duration = Date.now() - stepStartTime;
				totalTaskDuration += duration;
				await options.onStepError?.({ ...step, duration }, stepIndex, error);
			}
			return step;
		}),
	);

	const wallClockDuration = Date.now() - startTime;
	sequence.steps = executedSteps;
	sequence.duration = {
		totalTask: totalTaskDuration,
		wallClock: wallClockDuration,
	};

	// Handle sequence completion
	if (hasError) {
		sequence.status = "failed";
		await options.onSequenceError?.(
			new Error("Sequence execution failed"),
			sequence,
		);
	} else {
		sequence.status = "completed";
		await options.onSequenceComplete?.(sequence);
	}

	return { hasError, totalTaskDuration, wallClockDuration };
}

/**
 * Create patches to move step counts between states
 */
export function createStepCountPatches(
	from: keyof Task["steps"],
	to: keyof Task["steps"],
	count: number,
): Patch[] {
	return [
		{ path: `steps.${from}`, decrement: count },
		{ path: `steps.${to}`, increment: count },
	];
}

export interface ActExecutorOptions {
	act: Task;
	applyPatches(actId: TaskId, patches: Patch[]): void | Promise<void>;
	startGeneration(
		generationId: GenerationId,
		callbacks?: {
			onCompleted?: () => void | Promise<void>;
			onFailed?: (generation: Generation) => void | Promise<void>;
		},
	): Promise<void>;
	onActStart?: () => void | Promise<void>;
	onActComplete?: (hasError: boolean, duration: number) => void | Promise<void>;
	onSequenceSkip?: (sequence: Sequence, index: number) => void | Promise<void>;
	onSequenceStart?: (sequence: Sequence, index: number) => void | Promise<void>;
	onSequenceComplete?: (
		sequence: Sequence,
		index: number,
	) => void | Promise<void>;
	onSequenceError?: (
		sequence: Sequence,
		index: number,
		error: unknown,
	) => void | Promise<void>;
	onStepStart?: (
		step: Step,
		sequenceIndex: number,
		stepIndex: number,
	) => void | Promise<void>;
	onStepComplete?: (
		step: Step,
		sequenceIndex: number,
		stepIndex: number,
	) => void | Promise<void>;
	onStepError?: (
		step: Step,
		sequenceIndex: number,
		stepIndex: number,
		error: unknown,
	) => void | Promise<void>;
}

/**
 * Execute an act by running all its sequences in order
 */
export async function executeAct(
	opts: ActExecutorOptions,
): Promise<{ hasError: boolean; duration: number }> {
	const startTime = Date.now();
	let hasError = false;

	// Start act execution
	await opts.onActStart?.();
	await opts.applyPatches(opts.act.id, [patches.status.set("inProgress")]);

	// Execute each sequence
	for (let i = 0; i < opts.act.sequences.length; i++) {
		const sequence = opts.act.sequences[i];
		const stepCount = sequence.steps.length;

		// Skip remaining sequences if we have an error
		if (hasError) {
			// Cancel all remaining steps from all remaining sequences
			let totalRemainingSteps = 0;
			for (let j = i; j < opts.act.sequences.length; j++) {
				totalRemainingSteps += opts.act.sequences[j].steps.length;
			}

			await opts.applyPatches(
				opts.act.id,
				createStepCountPatches("queued", "cancelled", totalRemainingSteps),
			);

			// Notify about skipped sequences
			for (let j = i; j < opts.act.sequences.length; j++) {
				await opts.onSequenceSkip?.(opts.act.sequences[j], j);
			}
			break;
		}

		// Execute the sequence
		const result = await executeSequence({
			sequence,
			startGeneration: opts.startGeneration,
			onSequenceStart: async (sequence) => {
				await opts.applyPatches(opts.act.id, [
					patches.sequences(i).status.set("running"),
				]);
				// Move steps to in progress
				await opts.applyPatches(
					opts.act.id,
					createStepCountPatches("queued", "inProgress", stepCount),
				);
				await opts.onSequenceStart?.(sequence, i);
			},
			onStepStart: async (step, stepIndex) => {
				await opts.applyPatches(opts.act.id, [
					patches.sequences(i).steps(stepIndex).status.set("running"),
				]);
				await opts.onStepStart?.(step, i, stepIndex);
			},
			onStepComplete: async (step, stepIndex) => {
				await opts.applyPatches(opts.act.id, [
					...createStepCountPatches("inProgress", "completed", 1),
					patches.duration.totalTask.increment(step.duration),
					patches.sequences(i).steps(stepIndex).duration.set(step.duration),
					patches.sequences(i).duration.totalTask.increment(step.duration),
					patches.sequences(i).steps(stepIndex).status.set("completed"),
				]);
				await opts.onStepComplete?.(step, i, stepIndex);
			},
			onStepError: async (step, stepIndex, error) => {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";

				await opts.applyPatches(opts.act.id, [
					...createStepCountPatches("inProgress", "failed", 1),
					patches.duration.totalTask.increment(step.duration),
					patches.sequences(i).steps(stepIndex).status.set("failed"),
					patches.sequences(i).steps(stepIndex).duration.set(step.duration),
					patches.sequences(i).duration.totalTask.increment(step.duration),
					patches.annotations.push([
						{
							level: "error" as const,
							message: errorMessage,
							sequenceId: sequence.id,
							stepId: step.id,
						},
					]),
				]);
				await opts.onStepError?.(step, i, stepIndex, error);
			},
			onSequenceError: async (error, sequenceWithDuration) => {
				hasError = true;
				await opts.applyPatches(opts.act.id, [
					patches.sequences(i).status.set("failed"),
					patches
						.sequences(i)
						.duration.wallClock.set(sequenceWithDuration.duration.wallClock),
				]);
				await opts.onSequenceError?.(sequenceWithDuration, i, error);
			},
			onSequenceComplete: async (sequenceWithDuration) => {
				await opts.applyPatches(opts.act.id, [
					patches.sequences(i).status.set("completed"),
					patches
						.sequences(i)
						.duration.wallClock.set(sequenceWithDuration.duration.wallClock),
				]);
				await opts.onSequenceComplete?.(sequenceWithDuration, i);
			},
		});

		hasError = result.hasError;
	}

	// Complete act execution
	const duration = Date.now() - startTime;
	await opts.applyPatches(opts.act.id, [
		patches.status.set(hasError ? "failed" : "completed"),
		patches.duration.wallClock.set(duration),
	]);

	await opts.onActComplete?.(hasError, duration);

	return { hasError, duration };
}
