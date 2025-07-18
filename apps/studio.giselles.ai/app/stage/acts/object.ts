type Status = "success" | "in-progress" | "failed" | "pending" | "warning";

interface Step {
	id: string;
	text: string;
	status: Status;
}

export interface Sequence {
	id: string;
	name: string;
	count: number;
	status: Status;
	steps: Step[];
}

export interface Act {
	id: string;
	sequences: Sequence[];
}
