import { Select } from "@giselle-internal/ui/select";
import { DataStoreId, type DataStoreNode } from "@giselles-ai/protocol";
import { useDataStore } from "@giselles-ai/react";
import Link from "next/link";
import { useCallback } from "react";
import { useDeleteNode, useUpdateNodeData } from "../../../app-designer";
import { TriangleAlert } from "../../../icons";
import { NodePanelHeader } from "../ui/node-panel-header";
import {
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui/properties-panel";

export function DataStoreNodePropertiesPanel({
	node,
}: {
	node: DataStoreNode;
}) {
	const updateNodeData = useUpdateNodeData();
	const deleteNode = useDeleteNode();

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/data-store-node"
				onDelete={() => deleteNode(node.id)}
			/>
			<PropertiesPanelContent>
				<DataStorePropertiesContent node={node} />
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}

function DataStorePropertiesContent({ node }: { node: DataStoreNode }) {
	const updateNodeData = useUpdateNodeData();
	const dataStoreContext = useDataStore();
	const settingPath = dataStoreContext?.settingPath;
	const dataStores = dataStoreContext?.dataStores ?? [];

	const state = node.content.state;
	const selectedStoreId =
		state.status === "configured" ? state.dataStoreId : undefined;

	const selectedStore = dataStores.find(
		(store) => store.id === selectedStoreId,
	);

	const handleSelectStore = useCallback(
		(storeId: string) => {
			updateNodeData(node, {
				content: {
					...node.content,
					state: {
						status: "configured",
						dataStoreId: DataStoreId.parse(storeId),
					},
				},
			});
		},
		[node, updateNodeData],
	);

	const isConfiguredButMissingStore =
		selectedStoreId &&
		!dataStores.some((store) => store.id === selectedStoreId);

	if (!dataStoreContext) {
		return (
			<div className="flex flex-col gap-3 p-4 text-inverse">
				<span>Data stores are not available for this workspace.</span>
				{settingPath && (
					<Link href={settingPath} className="text-inverse underline">
						Set Up Data Store
					</Link>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-[16px] p-0">
			<div className="space-y-[12px]">
				<div className="space-y-[4px]">
					<p className="text-[14px] text-inverse">Data Store</p>
					{isConfiguredButMissingStore && (
						<div className="flex items-center gap-[6px] text-error-900 text-[13px]">
							<TriangleAlert className="size-[16px]" />
							<span>
								The selected data store "
								<span className="font-mono">{selectedStoreId}</span>" is no
								longer available. Please choose another store.
							</span>
						</div>
					)}
					<Select
						options={dataStores.map((store) => ({
							value: store.id,
							label: store.name,
						}))}
						value={selectedStoreId ?? ""}
						onValueChange={handleSelectStore}
						disabled={dataStores.length === 0}
						placeholder="Select a data store"
						triggerClassName={
							dataStores.length === 0
								? "opacity-40 cursor-not-allowed"
								: undefined
						}
					/>
				</div>

				{dataStores.length === 0 && (
					<div className="rounded-md border border-dashed border-border/15 bg-surface/10 px-4 py-6 text-sm text-inverse">
						No data stores available. Create one from settings to use it here.
					</div>
				)}
			</div>

			{selectedStore && (
				<div className="space-y-[8px]">
					<p className="text-[14px] text-inverse">Connection</p>
					<div className="rounded-md border border-border/10 bg-surface/10 px-3 py-2 text-[13px] text-inverse">
						<span className="font-medium">{selectedStore.name}</span>
					</div>
				</div>
			)}

			{settingPath && (
				<div className="flex justify-end pt-[8px]">
					<Link
						href={settingPath}
						target="_blank"
						rel="noopener noreferrer"
						className="text-[14px] text-inverse underline hover:text-inverse"
					>
						Manage Data Stores
					</Link>
				</div>
			)}
		</div>
	);
}
