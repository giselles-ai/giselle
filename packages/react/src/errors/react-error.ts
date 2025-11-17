/**
 * Symbol used for identifying React Error instances.
 * Enables checking if an error is an instance of ReactError across package versions.
 */
const marker = "giselle.react.error";
const symbol = Symbol.for(marker);

/**
 * Custom error class for Giselle React related errors.
 * @extends Error
 */
export class ReactError extends Error {
	private readonly [symbol] = true; // used in isInstance

	/**
	 * The underlying cause of the error, if any.
	 */
	readonly cause?: unknown;

	/**
	 * Creates a React Error.
	 *
	 * @param {Object} params - The parameters for creating the error.
	 * @param {string} params.name - The name of the error.
	 * @param {string} params.message - The error message.
	 * @param {unknown} [params.cause] - The underlying cause of the error.
	 */
	constructor({
		name,
		message,
		cause,
	}: {
		name: string;
		message: string;
		cause?: unknown;
	}) {
		super(message);

		this.name = name;
		this.cause = cause;
	}

	/**
	 * Checks if the given error is a React Error.
	 * @param {unknown} error - The error to check.
	 * @returns {boolean} True if the error is a React Error, false otherwise.
	 */
	static isInstance(error: unknown): error is ReactError {
		return ReactError.hasMarker(error, marker);
	}

	protected static hasMarker(error: unknown, marker: string): boolean {
		const markerSymbol = Symbol.for(marker);
		return (
			error != null &&
			typeof error === "object" &&
			markerSymbol in error &&
			typeof error[markerSymbol] === "boolean" &&
			error[markerSymbol] === true
		);
	}
}
