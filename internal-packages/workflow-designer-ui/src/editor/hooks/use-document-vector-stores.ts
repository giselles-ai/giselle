import useSWR from "swr";

export type DocumentVectorStoreIngestStatus =
	| "idle"
	| "running"
	| "completed"
	| "failed";

export interface DocumentVectorStore {
	id: string;
	name: string;
	embeddingProfileIds: number[];
	sources: Array<{
		id: string;
		fileName: string;
		ingestStatus: DocumentVectorStoreIngestStatus;
		ingestErrorCode: string | null;
	}>;
}

interface DocumentVectorStoresResponse {
	documentVectorStores: DocumentVectorStore[];
}

interface DocumentVectorStoresResult {
	stores: DocumentVectorStore[];
	isFeatureEnabled: boolean;
}

const DOCUMENT_VECTOR_STORES_KEY = "/api/vector-stores/document";

const documentVectorStoresFetcher = async (
	url: string,
): Promise<DocumentVectorStoresResult> => {
	const response = await fetch(url, { cache: "no-store" });
	if (response.status === 404) {
		return { stores: [], isFeatureEnabled: false };
	}
	if (!response.ok) {
		throw new Error(
			`Failed to fetch document vector stores: ${response.status}`,
		);
	}
	const payload = (await response.json()) as DocumentVectorStoresResponse;
	return { stores: payload.documentVectorStores, isFeatureEnabled: true };
};

type UseDocumentVectorStoresOptions = {
	shouldFetch?: boolean;
	fallbackStores?: DocumentVectorStore[];
	fallbackIsFeatureEnabled?: boolean;
};

export function useDocumentVectorStores({
	shouldFetch = true,
	fallbackStores,
	fallbackIsFeatureEnabled = true,
}: UseDocumentVectorStoresOptions = {}) {
	const swr = useSWR<DocumentVectorStoresResult>(
		shouldFetch ? DOCUMENT_VECTOR_STORES_KEY : null,
		documentVectorStoresFetcher,
		fallbackStores
			? {
					fallbackData: {
						stores: fallbackStores,
						isFeatureEnabled: fallbackIsFeatureEnabled,
					},
				}
			: undefined,
	);

	const stores = swr.data?.stores ?? fallbackStores ?? [];
	const isFeatureEnabled =
		swr.data?.isFeatureEnabled ?? fallbackIsFeatureEnabled;

	return {
		...swr,
		stores,
		isFeatureEnabled,
	};
}
