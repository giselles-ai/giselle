import { captureException } from "@sentry/nextjs";

interface IngestResultWithErrors {
	totalDocuments: number;
	successfulDocuments: number;
	failedDocuments: number;
	errors?: Array<{ document: unknown; error: Error }>;
}

interface BaseIngestParams {
	source: { owner: string; repo: string };
	teamDbId: number;
}

export function handleIngestErrors<T extends BaseIngestParams>(
	result: IngestResultWithErrors,
	params: T,
	documentType: string,
): void {
	if (result.errors && result.errors.length > 0) {
		const errorMessage = `Failed to ingest ${result.failedDocuments} out of ${result.totalDocuments} ${documentType} documents for ${params.source.owner}/${params.source.repo}`;
		console.error(errorMessage, result.errors);

		const aggregatedError = new Error(errorMessage);
		captureException(aggregatedError, {
			extra: {
				...params.source,
				teamDbId: params.teamDbId,
				totalDocuments: result.totalDocuments,
				successfulDocuments: result.successfulDocuments,
				failedDocuments: result.failedDocuments,
				errors: result.errors,
			},
		});
	}
}
