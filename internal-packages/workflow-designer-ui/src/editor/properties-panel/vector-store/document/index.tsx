import { Select } from "@giselle-internal/ui/select";
import type {
	DocumentVectorStoreSource,
	EmbeddingProfileId,
	VectorStoreNode,
} from "@giselle-sdk/data-type";
import {
	EMBEDDING_PROFILES,
	isEmbeddingProfileId,
} from "@giselle-sdk/data-type";
import {
	useVectorStore,
	useWorkflowDesigner,
	type VectorStoreContextValue,
} from "@giselle-sdk/giselle/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TriangleAlert } from "../../../../icons";
import {
	type DocumentVectorStore,
	type DocumentVectorStoreIngestStatus,
	useDocumentVectorStores,
} from "../../../hooks/use-document-vector-stores";

const INGEST_STATUS_STYLE: Record<
	DocumentVectorStoreIngestStatus,
	{ label: string; className: string }
> = {
	idle: {
		label: "Pending",
		className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
	},
	running: {
		label: "Processing",
		className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
	},
	completed: {
		label: "Ready",
		className: "bg-green-500/10 text-green-400 border-green-500/30",
	},
	failed: {
		label: "Failed",
		className: "bg-error-500/10 text-error-500 border-error-500/30",
	},
};

function IngestStatusBadge({
	status,
	errorCode,
}: {
	status: DocumentVectorStoreIngestStatus;
	errorCode: string | null;
}) {
	const { label, className } = INGEST_STATUS_STYLE[status];
	return (
		<span
			className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[12px] font-medium ${className}`}
			title={errorCode ? `Error: ${errorCode}` : undefined}
		>
			{label}
		</span>
	);
}

type DocumentVectorStoreNodePropertiesPanelProps = {
	node: VectorStoreNode;
};

export function DocumentVectorStoreNodePropertiesPanel({
	node,
}: DocumentVectorStoreNodePropertiesPanelProps) {
	const { updateNodeData } = useWorkflowDesigner();
	const vectorStore = useVectorStore();
	const vectorStoreValue = vectorStore as VectorStoreContextValue | undefined;
	const settingPath = vectorStoreValue?.documentSettingPath;

	const source = node.content.source as Extract<
		VectorStoreNode["content"]["source"],
		{ provider: "document" }
	>;

	const contextDocumentStores = (vectorStoreValue?.documentStores ??
		[]) as DocumentVectorStore[];
	const {
		stores: documentStores,
		error,
		isLoading,
		isFeatureEnabled,
	} = useDocumentVectorStores({
		shouldFetch: source.provider === "document",
		fallbackStores: contextDocumentStores,
	});

	const configuredState =
		source.state.status === "configured" ? source.state : undefined;

	const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(
		configuredState?.documentVectorStoreId,
	);
	const [selectedEmbeddingProfileId, setSelectedEmbeddingProfileId] = useState<
		EmbeddingProfileId | undefined
	>(configuredState?.embeddingProfileId ?? undefined);

	useEffect(() => {
		if (source.state.status === "configured") {
			setSelectedStoreId(source.state.documentVectorStoreId);
			setSelectedEmbeddingProfileId(
				source.state.embeddingProfileId ?? undefined,
			);
		} else {
			setSelectedStoreId(undefined);
			setSelectedEmbeddingProfileId(undefined);
		}
	}, [source.state]);

	const selectedStore = useMemo(() => {
		return documentStores.find((store) => store.id === selectedStoreId);
	}, [documentStores, selectedStoreId]);

	const embeddingProfileOptions = useMemo(() => {
		if (!selectedStore) {
			return [];
		}
		return selectedStore.embeddingProfileIds
			.slice()
			.sort((a, b) => a - b)
			.map((profileId) => {
				const profile =
					EMBEDDING_PROFILES[profileId as keyof typeof EMBEDDING_PROFILES];
				if (!profile) {
					return {
						value: profileId,
						label: `Profile ${profileId}`,
					};
				}
				return {
					value: profileId,
					label: `${profile.name} (${profile.dimensions} dimensions)`,
				};
			});
	}, [selectedStore]);

	const handleUpdateNode = useCallback(
		(storeId: string, embeddingProfileId?: EmbeddingProfileId) => {
			const store = documentStores.find(
				(candidate) => candidate.id === storeId,
			);
			const updatedOutputs = [...node.outputs];
			if (updatedOutputs[0]) {
				updatedOutputs[0] = {
					...updatedOutputs[0],
					label: store ? store.name : updatedOutputs[0].label,
				};
			}

			const nextState: DocumentVectorStoreSource = {
				provider: "document",
				state: {
					status: "configured",
					documentVectorStoreId: storeId,
					...(embeddingProfileId !== undefined ? { embeddingProfileId } : {}),
				},
			};

			updateNodeData(node, {
				outputs: updatedOutputs,
				content: {
					...node.content,
					source: nextState,
				},
			});
		},
		[documentStores, node, updateNodeData],
	);

	const handleSelectStore = useCallback(
		(storeId: string) => {
			setSelectedStoreId(storeId);
			const store = documentStores.find(
				(candidate) => candidate.id === storeId,
			);
			const preferredProfile = store?.embeddingProfileIds.find(
				(id): id is EmbeddingProfileId => isEmbeddingProfileId(id),
			);

			setSelectedEmbeddingProfileId(preferredProfile);
			handleUpdateNode(storeId, preferredProfile);
		},
		[documentStores, handleUpdateNode],
	);

	const handleSelectEmbeddingProfile = useCallback(
		(value: string) => {
			const maybeId = Number(value);
			if (!isEmbeddingProfileId(maybeId)) return;
			setSelectedEmbeddingProfileId(maybeId);
			if (selectedStoreId) {
				handleUpdateNode(selectedStoreId, maybeId);
			}
		},
		[handleUpdateNode, selectedStoreId],
	);

	const isConfiguredButMissingStore = useMemo(() => {
		if (!configuredState) return false;
		return !documentStores.some(
			(store) => store.id === configuredState.documentVectorStoreId,
		);
	}, [configuredState, documentStores]);

	if (!isFeatureEnabled) {
		return (
			<div className="flex flex-col gap-3 p-4 text-white-400">
				<span>
					Document vector stores are not available for this workspace.
				</span>
				{settingPath && (
					<Link href={settingPath} className="text-white-300 underline">
						Set Up Vector Store
					</Link>
				)}
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 text-error-500">
				Failed to load document vector stores. Please try again later.
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-[16px] p-0">
			<div className="space-y-[12px]">
				<div className="space-y-[4px]">
					<p className="text-[14px] text-white-400">Document Vector Store</p>
					{isConfiguredButMissingStore && configuredState && (
						<div className="flex items-center gap-[6px] text-error-900 text-[13px]">
							<TriangleAlert className="size-[16px]" />
							<span>
								The selected vector store "
								<span className="font-mono">
									{configuredState.documentVectorStoreId}
								</span>
								" is no longer available. Please choose another store.
							</span>
						</div>
					)}
					<Select
						options={documentStores.map((store) => ({
							value: store.id,
							label: store.name,
						}))}
						value={selectedStoreId ?? ""}
						onValueChange={
							!isLoading && documentStores.length > 0
								? handleSelectStore
								: undefined
						}
						placeholder={
							isLoading ? "Loading stores..." : "Select a document vector store"
						}
						triggerClassName={
							isLoading || documentStores.length === 0
								? "opacity-40 pointer-events-none"
								: undefined
						}
					/>
				</div>

				{!isLoading && documentStores.length === 0 && (
					<div className="rounded-md border border-dashed border-white/15 bg-black-900/20 px-4 py-6 text-sm text-white-400">
						No document vector stores available. Create one from settings to use
						it here.
					</div>
				)}
			</div>

			{selectedStore && embeddingProfileOptions.length > 0 && (
				<div className="space-y-[8px]">
					<p className="text-[14px] text-white-400">Embedding Model</p>
					<Select
						options={embeddingProfileOptions.map((option) => ({
							value: option.value.toString(),
							label: option.label,
						}))}
						value={selectedEmbeddingProfileId?.toString() ?? ""}
						onValueChange={handleSelectEmbeddingProfile}
						placeholder="Select embedding model"
					/>
				</div>
			)}

			{selectedStore && (
				<div className="space-y-[8px]">
					<p className="text-[14px] text-white-400">Uploaded Sources</p>
					{selectedStore.sources.length > 0 ? (
						<ul className="space-y-2">
							{selectedStore.sources.map((docSource) => (
								<li
									key={docSource.id}
									className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black-950/30 px-3 py-2"
								>
									<span className="truncate text-[13px] text-white-400">
										{docSource.fileName}
									</span>
									<IngestStatusBadge
										status={docSource.ingestStatus}
										errorCode={docSource.ingestErrorCode}
									/>
								</li>
							))}
						</ul>
					) : (
						<div className="rounded-md border border-dashed border-white/10 bg-black-950/20 px-3 py-4 text-[13px] text-white-400/80">
							No documents uploaded yet.
						</div>
					)}
				</div>
			)}

			{settingPath && (
				<div className="flex justify-end pt-[8px]">
					<Link
						href={settingPath}
						className="text-[14px] text-white-400 underline hover:text-white-300"
					>
						Set Up Vector Store
					</Link>
				</div>
			)}
		</div>
	);
}
