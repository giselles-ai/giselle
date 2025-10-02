import type { NodeLike } from "@giselle-sdk/data-type";
import { isVectorStoreNode } from "@giselle-sdk/data-type";
import {
	useVectorStore,
	type VectorStoreContextValue,
} from "@giselle-sdk/giselle/react";
import type { ReactElement } from "react";
import { useMemo } from "react";
import useSWR from "swr";

import { RequiresSetupBadge } from "./github-node-info";

type DocumentVectorStoreSummary = {
	id: string;
	name: string;
};

type DocumentVectorStoresResponse = {
	documentVectorStores: DocumentVectorStoreSummary[];
};

const documentStoresFetcher = async (
	url: string,
): Promise<DocumentVectorStoresResponse> => {
	const response = await fetch(url, { cache: "no-store" });
	if (response.status === 404) {
		return { documentVectorStores: [] };
	}
	if (!response.ok) {
		console.error("Failed to load document vector stores:", response.status);
		return { documentVectorStores: [] };
	}
	return (await response.json()) as DocumentVectorStoresResponse;
};

export function DocumentNodeInfo({
	node,
}: {
	node: NodeLike;
}): ReactElement | null {
	const isDocumentVectorStore = isVectorStoreNode(node, "document");
	const documentVectorStoreId = isDocumentVectorStore
		? node.content.source.state.status === "configured"
			? node.content.source.state.documentVectorStoreId
			: undefined
		: undefined;

	const vectorStore = useVectorStore();
	const vectorStoreValue = vectorStore as VectorStoreContextValue | undefined;
	const contextDocumentStores = vectorStoreValue?.documentStores ?? [];
	const { data } = useSWR<DocumentVectorStoresResponse>(
		documentVectorStoreId ? "/api/vector-stores/document" : null,
		documentStoresFetcher,
		{ fallbackData: { documentVectorStores: contextDocumentStores } },
	);

	const storeName = useMemo(() => {
		if (!documentVectorStoreId) {
			return undefined;
		}
		const list = data?.documentVectorStores ?? contextDocumentStores;
		return list.find((store) => store.id === documentVectorStoreId)?.name;
	}, [contextDocumentStores, data, documentVectorStoreId]);

	if (!isDocumentVectorStore) {
		return null;
	}

	if (!documentVectorStoreId) {
		return <RequiresSetupBadge />;
	}

	return (
		<div className="px-[16px]">
			<div className="inline-flex items-center rounded-full bg-black-900 px-[16px] py-[8px] text-[12px] font-medium text-white-200">
				{storeName ?? documentVectorStoreId}
			</div>
		</div>
	);
}
