import type { NodeLike } from "@giselles-ai/protocol";
import { isVectorStoreNode } from "@giselles-ai/protocol";
import {
	useVectorStore,
	type VectorStoreContextValue,
} from "@giselles-ai/react";
import type { ReactElement } from "react";
import { useMemo } from "react";
import { MarkdownFileIcon } from "../../../icons/markdown-file";
import { PdfFileIcon } from "../../../icons/pdf-file";
import { TextFileIcon } from "../../../icons/text-file";
import { useDocumentVectorStores } from "../../hooks/use-document-vector-stores";
import { RequiresSetupBadge } from "./requires-setup-badge";

type FileType = "pdf" | "txt" | "md";

const FILE_TYPE_ICONS: Record<
	FileType,
	React.ComponentType<{ className?: string }>
> = {
	pdf: PdfFileIcon,
	txt: TextFileIcon,
	md: MarkdownFileIcon,
};

const FILE_TYPE_EXTENSIONS: Record<string, FileType> = {
	".pdf": "pdf",
	".txt": "txt",
	".md": "md",
};

function StoreNameBadge({
	label,
	fileTypes,
}: {
	label: string;
	fileTypes: FileType[];
}) {
	return (
		<div className="px-[16px]">
			<div className="inline-flex items-center gap-1.5 rounded-full bg-github-node-1/50 px-[16px] py-1 text-[12px] font-medium text-inverse transition-colors">
				{fileTypes.length > 0 && (
					<div className="flex items-center gap-1">
						{fileTypes.map((fileType) => {
							const Icon = FILE_TYPE_ICONS[fileType];
							return (
								<Icon
									key={fileType}
									className="w-[14px] h-[14px] flex-shrink-0"
								/>
							);
						})}
					</div>
				)}
				<span>{label}</span>
			</div>
		</div>
	);
}

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
	const contextDocumentStores =
		(vectorStore as VectorStoreContextValue | undefined)?.documentStores ?? [];
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

	const fileTypes = useMemo(() => {
		if (!store?.sources || store.sources.length === 0) {
			return [];
		}
		const types = new Set<FileType>();
		for (const source of store.sources) {
			const fileName = source.fileName.toLowerCase();
			for (const [extension, fileType] of Object.entries(
				FILE_TYPE_EXTENSIONS,
			)) {
				if (fileName.endsWith(extension)) {
					types.add(fileType);
					break;
				}
			}
		}
		return Array.from(types);
	}, [store?.sources]);

	const storeLabel = store?.name ?? documentVectorStoreId;

	if (!isDocumentVectorStore) {
		return null;
	}

	if (!documentVectorStoreId) {
		return <RequiresSetupBadge />;
	}

	if (!store) {
		if (isLoading) {
			return <StoreNameBadge label={documentVectorStoreId} fileTypes={[]} />;
		}
		return <RequiresSetupBadge />;
	}

	return <StoreNameBadge label={storeLabel} fileTypes={fileTypes} />;
}
