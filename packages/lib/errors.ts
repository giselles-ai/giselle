export class UserDisplayableServerActionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class AgentTimeNotAvailableError extends UserDisplayableServerActionError {
	constructor(
		message = "Your agent time has been depleted. Please upgrade your plan to continue using this feature.",
	) {
		super(message);
		this.name = this.constructor.name;

		// Ensure proper stack trace in modern environments
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, AgentTimeNotAvailableError);
		}
	}
}

export class FileNotReadyError extends UserDisplayableServerActionError {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class GraphError extends Error {
	constructor(
		message: string,
		public readonly systemMessage: string,
		public readonly code: "CIRCULAR_DEPENDENCY" | "SELF_REFERENCE",
	) {
		super(message);
		this.name = "GraphError";
	}
}
