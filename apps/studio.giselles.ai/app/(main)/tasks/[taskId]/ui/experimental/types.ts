import type {
	GenerationStatus,
	OperationNode,
	Sequence,
	SequenceId,
	Step,
	StepId,
	Task,
	TaskId,
} from "@giselles-ai/protocol";

export type StepWithNode = Step & { node: OperationNode };

export type TaskWithStepWithNode = Omit<Task, "sequences"> & {
	sequences: Omit<Sequence, "steps"> &
		{
			steps: StepWithNode[];
		}[];
};

interface UIStepItem {
	// In the protocol, the structure is Sequence > Step,
	// but in the UI it's Step > StepItem,
	// so this is awkward but works
	id: StepId;
	title: string;
	subLabel?: string;
	node: OperationNode;
	status: GenerationStatus;
	finished: boolean;
}
export interface UIStep {
	id: SequenceId;
	/**  0-based */
	index: number;
	/** "Step 1" / "Step 2"*/
	title: string;
	/**
	 * Overall status of the step
	 * (e.g., failed if any item inside is failed)
	 */
	status: GenerationStatus;
	items: UIStepItem[];
}

export interface UITask {
	id: TaskId;
	title: string;
	steps: UIStep[];
}
