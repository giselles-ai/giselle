export interface IngestProgress {
	currentDocument?: string;
	processedDocuments: number;
}

export interface IngestError {
	document: string;
	error: Error;
	willRetry: boolean;
	attemptNumber: number;
}

export interface IngestResult {
	totalDocuments: number;
	successfulDocuments: number;
	failedDocuments: number;
	metadataOnlyUpdates: number;
	errors: Array<{ document: string; error: Error }>;
}
