import type { WorkflowId, WorkspaceId } from "@giselle-sdk/data-type";

class BaseError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = this.constructor.name;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export class WorkflowError extends BaseError {
	readonly workspaceId: WorkspaceId;
	readonly workflowId: WorkflowId;

	/**
	 * @param message error message
	 * @param workspaceId workspace ID
	 * @param workflowId workflow ID
	 * @param options error options
	 */
	constructor(
		message: string,
		workspaceId: WorkspaceId,
		workflowId: WorkflowId,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = "WorkflowError";
		this.workspaceId = workspaceId;
		this.workflowId = workflowId;
	}
}

export function isWorkflowError(error: unknown): error is WorkflowError {
	return (
		typeof error === "object" &&
		error !== null &&
		"name" in error &&
		error.name === "WorkflowError"
	);
}

export class UsageLimitError extends BaseError {
	readonly message: string;

	constructor(message: string) {
		super(message);
		this.name = "UsageLimitError";
		this.message = message;
	}
}

export function isUsageLimitError(error: unknown): error is UsageLimitError {
	return (
		typeof error === "object" &&
		error !== null &&
		"name" in error &&
		error.name === "UsageLimitError"
	);
}
