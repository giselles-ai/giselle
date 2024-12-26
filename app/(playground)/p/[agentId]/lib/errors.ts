export class AgentTimeNotAvailableError extends Error {
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
