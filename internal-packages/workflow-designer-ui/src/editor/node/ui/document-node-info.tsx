import type { NodeLike } from "@giselle-sdk/data-type";
import { isVectorStoreNode } from "@giselle-sdk/data-type";
import {
	useVectorStore,
	type VectorStoreContextValue,
} from "@giselle-sdk/giselle/react";
import type { ReactElement } from "react";
import { useMemo } from "react";

import {
	type DocumentVectorStore,
	useDocumentVectorStores,
} from "../../hooks/use-document-vector-stores";
import { RequiresSetupBadge } from "./github-node-info";

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
	const contextDocumentStores = (vectorStoreValue?.documentStores ??
		[]) as DocumentVectorStore[];
	const { stores, isLoading } = useDocumentVectorStores({
		shouldFetch: Boolean(documentVectorStoreId),
		fallbackStores: contextDocumentStores,
	});

	const store = useMemo(() => {
		if (!documentVectorStoreId) {
			return undefined;
		}
		return stores.find((candidate) => candidate.id === documentVectorStoreId);
	}, [documentVectorStoreId, stores]);
	const storeLabel = store?.name ?? documentVectorStoreId;

	if (!isDocumentVectorStore) {
		return null;
	}

	if (!documentVectorStoreId) {
		return <RequiresSetupBadge />;
	}

	if (!store) {
		if (isLoading) {
			return (
				<div className="px-[16px]">
					<div className="inline-flex items-center rounded-full bg-black-900 px-[16px] py-[8px] text-[12px] font-medium text-white-200">
						{documentVectorStoreId}
					</div>
				</div>
			);
		}
		return <RequiresSetupBadge />;
	}

	return (
		<div className="px-[16px]">
			<div className="inline-flex items-center rounded-full bg-black-900 px-[16px] py-[8px] text-[12px] font-medium text-white-200">
				{storeLabel}
			</div>
		</div>
	);
}
