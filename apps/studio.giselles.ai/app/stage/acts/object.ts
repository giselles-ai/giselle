import type { GenerationId } from "@giselle-sdk/data-type";

type Status = "success" | "in-progress" | "failed" | "pending" | "warning";

export interface Step {
	id: string;
	text: string;
	status: Status;
	generationId: GenerationId;
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
