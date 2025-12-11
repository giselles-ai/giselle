export type StatusFilter =
	| "created"
	| "inProgress"
	| "completed"
	| "failed"
	| "cancelled";

export type ActWithNavigation = {
	id: string;
	status: StatusFilter;
	createdAt: string;
	workspaceName: string;
	teamName: string;
	link: string;
	llmModels?: string[];
	inputValues?: string;
};
