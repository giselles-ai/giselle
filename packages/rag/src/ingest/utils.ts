import type { IngestError } from "./types";

interface RetryOptions {
	maxRetries?: number;
	retryDelay?: number;
	onError?: (error: IngestError) => void;
	context?: string;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Execute an operation with retry logic
 */
export async function retryOperation<T>(
	operation: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const {
		maxRetries = DEFAULT_MAX_RETRIES,
		retryDelay = DEFAULT_RETRY_DELAY,
		onError,
		context = "operation",
	} = options;

	const attemptOperation = async (attempt = 1): Promise<T> => {
		try {
			return await operation();
		} catch (error) {
			const isLastAttempt = attempt >= maxRetries;

			if (onError) {
				onError({
					document: context,
					error: error instanceof Error ? error : new Error(String(error)),
					willRetry: !isLastAttempt,
					attemptNumber: attempt,
				});
			}

			if (isLastAttempt) {
				throw error;
			}

			const delay = retryDelay * 2 ** (attempt - 1);
			await new Promise((resolve) => setTimeout(resolve, delay));

			return attemptOperation(attempt + 1);
		}
	};

	return await attemptOperation();
}

/**
 * Create batches from an async iterable
 */
export async function* createBatches<T>(
	items: AsyncIterable<T>,
	batchSize: number,
): AsyncGenerator<T[]> {
	const batch: T[] = [];

	for await (const item of items) {
		batch.push(item);
		if (batch.length >= batchSize) {
			yield [...batch];
			batch.length = 0;
		}
	}

	if (batch.length > 0) {
		yield batch;
	}
}
