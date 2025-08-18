import { DocumentLoaderError } from "@giselle-sdk/rag";
import { RequestError } from "@octokit/request-error";

/**
 * Execute a GitHub REST API request with retry logic and error handling
 */
export async function executeRestRequest<T>(
	operation: () => Promise<T>,
	resourceType: string,
	resourcePath: string,
	currentAttempt = 0,
	maxAttempt = 3,
): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		if (error instanceof RequestError) {
			// Handle 5xx errors with retry
			if (error.status && error.status >= 500) {
				if (currentAttempt >= maxAttempt) {
					throw DocumentLoaderError.fetchError(
						"github",
						`fetching ${resourceType}`,
						error,
						{
							statusCode: error.status,
							resourceType,
							resourcePath,
							retryAttempts: currentAttempt,
							maxAttempts: maxAttempt,
						},
					);
				}
				await new Promise((resolve) =>
					setTimeout(resolve, 2 ** currentAttempt * 1000),
				);
				return executeRestRequest(
					operation,
					resourceType,
					resourcePath,
					currentAttempt + 1,
					maxAttempt,
				);
			}

			// Handle 404 errors
			if (error.status === 404) {
				throw DocumentLoaderError.notFound(resourcePath, error, {
					source: "github",
					resourceType,
					statusCode: 404,
				});
			}

			// Handle rate limit errors (403, 429)
			if (error.status === 403 || error.status === 429) {
				throw DocumentLoaderError.rateLimited(
					"github",
					error.response?.headers?.["retry-after"],
					error,
					{
						statusCode: error.status,
						resourceType,
						resourcePath,
					},
				);
			}

			// Other 4xx errors
			if (error.status && error.status >= 400 && error.status < 500) {
				throw DocumentLoaderError.fetchError(
					"github",
					`fetching ${resourceType}`,
					error,
					{
						statusCode: error.status,
						resourceType,
						resourcePath,
						errorMessage: error.message,
					},
				);
			}
		}
		// Re-throw any other errors
		throw error;
	}
}
