import { type StreamableValue, readStreamableValue } from "ai/rsc";
import type {
	Artifact,
	CompletedExecution,
	CompletedJobExecution,
	CompletedStepExecution,
	Connection,
	Execution,
	ExecutionSnapshot,
	FailedExecution,
	FailedJobExecution,
	FailedStepExecution,
	Flow,
	JobExecution,
	Node,
	SkippedJobExecution,
	StepExecution,
	StepId,
	TextArtifact,
	TextArtifactObject,
} from "../types";
import {
	createArtifactId,
	createExecutionSnapshotId,
	isStreamableValue,
	toErrorWithMessage,
} from "./utils";

type OnArtifactChange = (artifact: Artifact) => void;

type OnExecutionChange = (execution: Execution) => void;
type OnJobExecutionChange = (jobExecution: JobExecution) => void;
type OnStepExecutionChange = (stepExecution: StepExecution) => void;

type OnStepFinish = (
	stepExecution: CompletedStepExecution,
	artifact: TextArtifact,
) => void;
type OnStepFail = (stepExecution: FailedStepExecution) => void;
type OnPerformExecutionFinish = (payload: {
	endedAt: number;
	durationMs: number;
	execution: CompletedExecution | FailedExecution;
}) => Promise<void>;

type StepResult = StreamableValue<TextArtifactObject> | TextArtifactObject;
type ExecuteStepFn = (stepId: StepId) => Promise<StepResult>;
type StepResultAdapter = (
	result: StepResult,
	updateArtifact?: (content: TextArtifactObject) => void,
) => Promise<TextArtifactObject>;

const defaultStepResultAdapter: StepResultAdapter = async (
	result,
	updateArtifact,
) => {
	const textArtifactObject: TextArtifactObject = {
		type: "text",
		title: "",
		content: "",
		messages: { plan: "", description: "" },
	};

	if (isStreamableValue(result)) {
		return textArtifactObject;
	}

	return result;
};

export function createExecutionSnapshot({
	flow,
	execution,
	nodes,
	connections,
}: {
	flow: Flow;
	execution: Execution;
	nodes: Node[];
	connections: Connection[];
}) {
	return {
		id: createExecutionSnapshotId(),
		execution,
		nodes,
		connections,
		flow,
	} as ExecutionSnapshot;
}

interface ExecuteStepOptions {
	stepExecution: StepExecution;
	stepResultAdapter?: StepResultAdapter;
	executeStepFn: ExecuteStepFn;
	onStepExecutionChange?: OnStepExecutionChange;
	onArtifactChange?: OnArtifactChange;
	onStepFinish?: OnStepFinish;
	onStepFail?: OnStepFail;
}
async function executeStep({
	stepExecution,
	executeStepFn,
	stepResultAdapter = defaultStepResultAdapter,
	onStepExecutionChange,
	onArtifactChange,
	onStepFinish,
	onStepFail,
}: ExecuteStepOptions): Promise<CompletedStepExecution | FailedStepExecution> {
	if (stepExecution.status === "completed") {
		return stepExecution;
	}
	const stepRunStartedAt = Date.now();
	const artifactId = createArtifactId();

	onStepExecutionChange?.({
		...stepExecution,
		status: "running",
		runStartedAt: stepRunStartedAt,
	});
	onArtifactChange?.({
		id: artifactId,
		type: "streamArtifact",
		creatorNodeId: stepExecution.nodeId,
		object: {
			type: "text",
			title: "",
			content: "",
			messages: { plan: "", description: "" },
		},
	});
	try {
		// Execute step and process stream
		const stream = await executeStepFn(stepExecution.stepId);
		const finalArtifact = await stepResultAdapter(stream, (content) =>
			onArtifactChange?.({
				id: artifactId,
				type: "streamArtifact",
				creatorNodeId: stepExecution.nodeId,
				object: content,
			}),
		);

		const completedStepExecution: CompletedStepExecution = {
			...stepExecution,
			status: "completed",
			runStartedAt: stepRunStartedAt,
			durationMs: Date.now() - stepRunStartedAt,
		};
		const generatedArtifact = {
			id: artifactId,
			type: "generatedArtifact",
			creatorNodeId: stepExecution.nodeId,
			createdAt: Date.now(),
			object: finalArtifact,
		} satisfies TextArtifact;
		onStepExecutionChange?.(completedStepExecution);
		onArtifactChange?.(generatedArtifact);
		onStepFinish?.(completedStepExecution, generatedArtifact);
		return completedStepExecution;
	} catch (unknownError) {
		const error = toErrorWithMessage(unknownError).message;
		const failedStepExecution: FailedStepExecution = {
			...stepExecution,
			status: "failed",
			runStartedAt: stepRunStartedAt,
			durationMs: Date.now() - stepRunStartedAt,
			error,
		};
		onStepExecutionChange?.(failedStepExecution);
		onStepFail?.(failedStepExecution);
		return failedStepExecution;
	}
}

interface ExcuteJobOptions {
	jobExecution: JobExecution;
	stepResultAdapter?: StepResultAdapter;
	executeStepFn: ExecuteStepFn;
	onJobExecutionChange?: OnJobExecutionChange;
	onArtifactChange?: OnArtifactChange;
	onStepFinish?: OnStepFinish;
	onStepFail?: OnStepFail;
}
async function executeJob({
	jobExecution,
	executeStepFn,
	stepResultAdapter,
	onArtifactChange,
	onJobExecutionChange,
	onStepFinish,
	onStepFail,
}: ExcuteJobOptions): Promise<CompletedJobExecution | FailedJobExecution> {
	const jobRunStartedAt = Date.now();
	let currentJobExecution = {
		...jobExecution,
		status: "running",
		runStartedAt: jobRunStartedAt,
	} as JobExecution;

	onJobExecutionChange?.(currentJobExecution);

	// Execute all steps in parallel
	const stepExecutions = await Promise.all(
		jobExecution.stepExecutions.map((stepExecution) =>
			executeStep({
				stepExecution,
				executeStepFn,
				stepResultAdapter,
				onArtifactChange,
				onStepFinish,
				onStepFail,
				onStepExecutionChange: (changedStepExecution) => {
					currentJobExecution = {
						...jobExecution,
						stepExecutions: jobExecution.stepExecutions.map((stepExecution) =>
							stepExecution.id === changedStepExecution.id
								? changedStepExecution
								: stepExecution,
						),
					};
					onJobExecutionChange?.(currentJobExecution);
				},
			}),
		),
	);

	const jobDurationMs = stepExecutions.reduce(
		(sum, duration) => sum + duration.durationMs,
		0,
	);
	const allStepsCompleted = stepExecutions.every(
		(step) => step.status === "completed",
	);

	if (allStepsCompleted) {
		// Complete job execution
		const completedJobExecution: CompletedJobExecution = {
			...jobExecution,
			stepExecutions,
			status: "completed",
			runStartedAt: jobRunStartedAt,
			durationMs: jobDurationMs,
		};
		onJobExecutionChange?.(completedJobExecution);
		return completedJobExecution;
	}

	const failedJobExecution: FailedJobExecution = {
		...jobExecution,
		stepExecutions,
		status: "failed",
		runStartedAt: jobRunStartedAt,
		durationMs: jobDurationMs,
	};
	onJobExecutionChange?.(failedJobExecution);
	return failedJobExecution;
}

export interface PerformFlowExecutionOptions {
	initialExecution: Execution;
	executeStepFn: ExecuteStepFn;
	stepResultAdapter?: StepResultAdapter;
	onExecutionChange?: OnExecutionChange;
	onStepFinish?: OnStepFinish;
	onStepFail?: OnStepFail;
	onFinish?: OnPerformExecutionFinish;
}
export async function performFlowExecution({
	initialExecution,
	onExecutionChange,
	executeStepFn,
	stepResultAdapter,
	onStepFinish,
	onStepFail,
	onFinish,
}: PerformFlowExecutionOptions) {
	let currentExecution = initialExecution;
	let totalFlowDurationMs = 0;
	let hasFailed = false;

	// Execute jobs sequentially
	for (const jobExecution of currentExecution.jobExecutions) {
		if (hasFailed) {
			const skippedJob: SkippedJobExecution = {
				...jobExecution,
				status: "skipped",
				stepExecutions: jobExecution.stepExecutions.map((step) => ({
					...step,
					status: "skipped",
				})),
			};
			currentExecution = {
				...currentExecution,
				jobExecutions: currentExecution.jobExecutions.map((job) =>
					job.id === jobExecution.id ? skippedJob : job,
				),
			};
			onExecutionChange?.(currentExecution);
			continue;
		}

		if (jobExecution.status === "completed") {
			continue;
		}

		const executedJob = await executeJob({
			jobExecution,
			executeStepFn,
			stepResultAdapter,
			onJobExecutionChange: (changedJobExecution) => {
				currentExecution = {
					...currentExecution,
					jobExecutions: currentExecution.jobExecutions.map((job) =>
						job.id === changedJobExecution.id ? changedJobExecution : job,
					),
				};
				onExecutionChange?.(currentExecution);
			},
			onArtifactChange: (changedArtifact) => {
				const artifactMap = new Map(
					currentExecution.artifacts.map((artifact) => [artifact.id, artifact]),
				);
				artifactMap.set(changedArtifact.id, changedArtifact);
				currentExecution = {
					...currentExecution,
					artifacts: Array.from(artifactMap.values()),
				};
				onExecutionChange?.(currentExecution);
			},
			onStepFinish,
			onStepFail,
		});

		totalFlowDurationMs += executedJob.durationMs;
		if (executedJob.status === "failed") {
			hasFailed = true;
		}
	}

	// Update final execution state
	if (hasFailed) {
		currentExecution = {
			...currentExecution,
			status: "failed",
			durationMs: totalFlowDurationMs,
		} as FailedExecution;
	} else {
		currentExecution = {
			...currentExecution,
			status: "completed",
			durationMs: totalFlowDurationMs,
			resultArtifact:
				currentExecution.artifacts[currentExecution.artifacts.length - 1],
		} as CompletedExecution;
	}

	await onFinish?.({
		endedAt: Date.now(),
		durationMs: totalFlowDurationMs,
		execution: currentExecution,
	});
	return currentExecution;
}
