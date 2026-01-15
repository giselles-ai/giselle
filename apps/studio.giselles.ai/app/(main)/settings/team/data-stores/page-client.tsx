"use client";

import { EmptyState } from "@giselle-internal/ui/empty-state";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import { Pencil, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "../vector-stores/ui/glass-card";
import { RepoActionMenu } from "../vector-stores/ui/repo-action-menu";
import { SectionHeader } from "../vector-stores/ui/section-header";
import { DataStoreCreateDialog } from "./data-store-create-dialog";
import { DataStoreDeleteDialog } from "./data-store-delete-dialog";
import { DataStoreEditDialog } from "./data-store-edit-dialog";
import type { DataStoreListItem } from "./types";

type DataStoresPageClientProps = {
	dataStores: DataStoreListItem[];
};

type ModalState =
	| { type: "closed" }
	| { type: "creating"; key: number }
	| { type: "editing"; dataStore: DataStoreListItem }
	| { type: "deleting"; dataStore: DataStoreListItem };

export function DataStoresPageClient({
	dataStores,
}: DataStoresPageClientProps) {
	const [modalState, setModalState] = useState<ModalState>({ type: "closed" });

	const handleCreateClick = () => {
		setModalState((prev) => ({
			type: "creating",
			key: prev.type === "creating" ? prev.key + 1 : 0,
		}));
	};

	const handleModalClose = () => {
		setModalState({ type: "closed" });
	};

	const handleEditClick = (dataStore: DataStoreListItem) => {
		setModalState({ type: "editing", dataStore });
	};

	const handleDeleteClick = (dataStore: DataStoreListItem) => {
		setModalState({ type: "deleting", dataStore });
	};

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<PageHeading as="h1" glow>
					Data Stores
				</PageHeading>
				<GlassButton type="button" onClick={handleCreateClick}>
					<Plus className="size-4" />
					New Data Store
				</GlassButton>
			</div>

			<Card className="rounded-[8px] bg-transparent p-6 border-0">
				<SectionHeader
					title="PostgreSQL"
					description="Connect to PostgreSQL databases to query and interact with your data."
					className="mb-4"
				/>

				{dataStores.length > 0 ? (
					<div className="space-y-4">
						{dataStores.map((dataStore) => (
							<DataStoreItem
								key={dataStore.id}
								dataStore={dataStore}
								onEdit={handleEditClick}
								onDelete={handleDeleteClick}
							/>
						))}
					</div>
				) : (
					<div className="text-center py-16 bg-surface rounded-lg">
						<EmptyState
							title="No data stores yet"
							description='Please create a data store using the "New Data Store" button.'
						/>
					</div>
				)}
			</Card>

			{modalState.type === "creating" && (
				<DataStoreCreateDialog
					key={modalState.key}
					isOpen={true}
					onOpenChange={(open) => {
						if (!open) handleModalClose();
					}}
					onSuccess={handleModalClose}
				/>
			)}

			{modalState.type === "editing" && (
				<DataStoreEditDialog
					isOpen={true}
					onOpenChange={(open) => {
						if (!open) handleModalClose();
					}}
					dataStore={modalState.dataStore}
					onSuccess={handleModalClose}
				/>
			)}

			{modalState.type === "deleting" && (
				<DataStoreDeleteDialog
					isOpen={true}
					onOpenChange={(open) => {
						if (!open) handleModalClose();
					}}
					dataStore={modalState.dataStore}
					onSuccess={handleModalClose}
				/>
			)}
		</div>
	);
}

type DataStoreItemProps = {
	dataStore: DataStoreListItem;
	onEdit: (dataStore: DataStoreListItem) => void;
	onDelete: (dataStore: DataStoreListItem) => void;
};

function DataStoreItem({ dataStore, onEdit, onDelete }: DataStoreItemProps) {
	return (
		<GlassCard className="group" paddingClassName="px-[24px] py-[16px]">
			<div className="flex items-start justify-between gap-4 mb-4">
				<div>
					<h5 className="text-inverse font-medium text-[16px] leading-[22.4px] font-sans">
						{dataStore.name}
					</h5>
					<div className="text-text-muted text-[13px] leading-[18px] font-geist mt-1">
						ID: {dataStore.id}
					</div>
				</div>
				<RepoActionMenu
					id={`data-store-actions-${dataStore.id}`}
					actions={[
						{
							value: "edit",
							label: "Edit",
							icon: <Pencil className="h-4 w-4" />,
							onSelect: () => onEdit(dataStore),
						},
						{
							value: "delete",
							label: "Delete",
							icon: <Trash className="h-4 w-4 text-error-900" />,
							destructive: true,
							onSelect: () => onDelete(dataStore),
						},
					]}
				/>
			</div>
		</GlassCard>
	);
}
