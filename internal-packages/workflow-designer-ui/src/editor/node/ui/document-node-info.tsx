import type { NodeLike } from "@giselles-ai/protocol";
import { isVectorStoreNode } from "@giselles-ai/protocol";
import {
	useVectorStore,
	type VectorStoreContextValue,
} from "@giselles-ai/react";
import type { ReactElement } from "react";
import { useMemo } from "react";

import {
	type DocumentVectorStore,
	useDocumentVectorStores,
} from "../../hooks/use-document-vector-stores";
import { MarkdownFileIcon } from "../../../icons/markdown-file";
import { PdfFileIcon } from "../../../icons/pdf-file";
import { TextFileIcon } from "../../../icons/text-file";
import { RequiresSetupBadge } from "./requires-setup-badge";

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

	// Extract file type from file names
	const fileTypes = useMemo(() => {
		if (!store?.sources || store.sources.length === 0) {
			return [];
		}
		const types = new Set<"pdf" | "txt" | "md">();
		for (const source of store.sources) {
			const fileName = source.fileName.toLowerCase();
			if (fileName.endsWith(".pdf")) {
				types.add("pdf");
			} else if (fileName.endsWith(".txt")) {
				types.add("txt");
			} else if (fileName.endsWith(".md")) {
				types.add("md");
			}
		}
		return Array.from(types);
	}, [store?.sources]);

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
					<div className="inline-flex items-center rounded-full bg-github-node-1/50 px-[16px] py-1 text-[12px] font-medium text-inverse transition-colors">
						{documentVectorStoreId}
					</div>
				</div>
			);
		}
		return <RequiresSetupBadge />;
	}

	return (
		<div className="px-[16px]">
			<div className="inline-flex items-center gap-1.5 rounded-full bg-github-node-1/50 px-[16px] py-1 text-[12px] font-medium text-inverse transition-colors">
				{fileTypes.length > 0 && (
					<div className="flex items-center gap-1">
						{fileTypes.map((fileType) => {
							switch (fileType) {
								case "pdf":
									return (
										<PdfFileIcon
											key="pdf"
											className="w-[14px] h-[14px] flex-shrink-0"
										/>
									);
								case "txt":
									return (
										<TextFileIcon
											key="txt"
											className="w-[14px] h-[14px] flex-shrink-0"
										/>
									);
								case "md":
									return (
										<MarkdownFileIcon
											key="md"
											className="w-[14px] h-[14px] flex-shrink-0"
										/>
									);
								default:
									return null;
							}
						})}
					</div>
				)}
				<span>{storeLabel}</span>
			</div>
		</div>
	);
}
