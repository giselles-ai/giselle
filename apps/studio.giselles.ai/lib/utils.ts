import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const isEmailFromRoute06 = (email: string): boolean => {
	const domain = email.split("@")[1];
	return domain ? domain.endsWith("route06.co.jp") : false;
};

/**
 * Error thrown when the maximum number of retries is exceeded.
 * This error contains an array of errors that occurred during the retry attempts.
 */
class MaxRetriesExceededError extends Error {
	readonly errors: unknown[];

	constructor(errors: unknown[]) {
		super("Max retries exceeded");
		this.errors = errors;
		this.name = this.constructor.name;
		Object.setPrototypeOf(this, MaxRetriesExceededError.prototype);
	}
}

type RetryOptions = {
	maxRetries: number;
	onRetry?: (retryCount: number, error: unknown) => void;
	shouldAbort?: (error: unknown) => boolean;
	// Base delay for exponential backoff (in milliseconds)
	baseDelay?: number;
	// Maximum delay cap (in milliseconds)
	maxDelay?: number;
	// Exponential backoff factor
	backoffFactor?: number;
	// Whether to use exponential backoff
	useExponentialBackoff?: boolean;
};

export async function withRetry<T>(
	fn: () => Promise<T>,
	options: Partial<RetryOptions> = {},
): Promise<T> {
	const {
		maxRetries = 3,
		onRetry = () => {},
		shouldAbort = () => false,
		baseDelay = 1000,
		maxDelay = 30000,
		backoffFactor = 2,
		useExponentialBackoff = false,
	} = options;

	const sleep = (ms: number) =>
		new Promise((resolve) => setTimeout(resolve, ms));

	const calculateDelay = (i: number) => {
		if (!useExponentialBackoff) {
			return baseDelay;
		}
		// Calculate delay with exponential backoff and jitter
		return Math.min(
			maxDelay,
			baseDelay * backoffFactor ** i + Math.random() * 1000,
		);
	};

	// Store all errors that occur during retry attempts
	const errors: unknown[] = [];

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error: unknown) {
			// If shouldAbort returns true, stop retrying and throw immediately
			if (shouldAbort(error)) {
				throw error;
			}

			// Store the error and notify via onRetry callback
			errors.push(error);
			onRetry(i, error);

			if (i < maxRetries - 1) {
				const delay = calculateDelay(i);
				await sleep(delay);
			}
		}
	}

	// If all retries are exhausted, throw an error with the history of errors
	throw new MaxRetriesExceededError(errors);
}
