export class TierAccessError extends Error {
	constructor(message?: string) {
		super(
			message ||
				"Access denied: insufficient tier for the requested language model.",
		);
		this.name = "TierAccessError";
	}
}

export class AgentTimeLimitError extends Error {
	constructor(message?: string) {
		super(
			message ||
				"Access denied: insufficient agent time for the requested generation.",
		);
		this.name = "AgentTimeLimitError";
	}
}
