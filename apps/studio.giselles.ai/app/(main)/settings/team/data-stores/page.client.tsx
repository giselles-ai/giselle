"use client";

import { EmptyState } from "@giselle-internal/ui/empty-state";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import { Pencil, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { GlassButton } from "@/components/ui/glass-button";
import type { TeamPlan } from "@/db/schema";
import { GlassCard } from "../vector-stores/ui/glass-card";
import { RepoActionMenu } from "../vector-stores/ui/repo-action-menu";
import { SectionHeader } from "../vector-stores/ui/section-header";
import { DataStoreCreateDialog } from "./data-store-create-dialog";
import { DataStoreDeleteDialog } from "./data-store-delete-dialog";
import { DataStoreEditDialog } from "./data-store-edit-dialog";
import type { DataStoreListItem } from "./types";

type DataStoresPageClientProps = {
	dataStores: DataStoreListItem[];
	hasAccess: boolean;
	maxStores: number;
	teamPlan: TeamPlan;
	isCreateDisabled: boolean;
	createDisabledReason?: string;
};

type ModalState =
	| { type: "closed" }
	| { type: "creating"; key: number }
	| { type: "editing"; dataStore: DataStoreListItem }
	| { type: "deleting"; dataStore: DataStoreListItem };

export function DataStoresPageClient({
	dataStores,
	hasAccess,
	maxStores,
	teamPlan,
	isCreateDisabled,
	createDisabledReason,
}: DataStoresPageClientProps) {
	const [modalState, setModalState] = useState<ModalState>({ type: "closed" });
	const usageCount = dataStores.length;

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
		<div className="flex flex-col gap-page-horizontal">
			<div className="flex justify-between items-center">
				<PageHeading as="h1" glow>
					Data Stores
				</PageHeading>
				<GlassButton
					type="button"
					onClick={handleCreateClick}
					disabled={isCreateDisabled}
					title={createDisabledReason}
				>
					<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
						<Plus className="size-3 text-link-muted" />
					</span>
					New Data Store
				</GlassButton>
			</div>

			<Card className="rounded-[8px] bg-transparent p-6 border-0">
				<SectionHeader
					title="PostgreSQL"
					description="Connect to PostgreSQL databases to query and interact with your data."
					className="mb-0"
				/>
				<div className="my-4">
					<DataStoreUsageNotice
						hasAccess={hasAccess}
						usageCount={usageCount}
						maxStores={maxStores}
						teamPlan={teamPlan}
					/>
				</div>

				{hasAccess ? (
					dataStores.length > 0 ? (
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
						<EmptyDataStoreCard />
					)
				) : (
					<DataStoreLockedCard />
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

function DataStoreUsageNotice({
	hasAccess,
	usageCount,
	maxStores,
	teamPlan,
}: {
	hasAccess: boolean;
	usageCount: number;
	maxStores: number;
	teamPlan: TeamPlan;
}) {
	if (!hasAccess) {
		return (
			<Alert
				variant="destructive"
				className="border-error-900/40 bg-error-900/10 text-error-900"
			>
				<AlertTitle className="text-[13px] font-semibold text-error-900">
					Data Stores are not included in the {getPlanLabel(teamPlan)} plan
				</AlertTitle>
				<AlertDescription className="text-[12px] text-error-900/80">
					Upgrade to{" "}
					<Link className="underline" href="/settings/team">
						Pro or Team
					</Link>{" "}
					to connect PostgreSQL databases with Data Stores.
				</AlertDescription>
			</Alert>
		);
	}

	const remaining = Math.max(maxStores - usageCount, 0);
	const isLimitReached = remaining === 0;

	return (
		<div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
			<div className="flex items-center justify-between text-[13px] text-text/70">
				<span>Data Stores used</span>
				<span className="font-semibold text-inverse">
					{usageCount} / {maxStores}
				</span>
			</div>
			<p className="mt-1 text-[12px] text-text/60">
				{isLimitReached
					? `You've used all Data Stores included in your ${getPlanLabel(teamPlan)} plan.`
					: `${remaining} Data ${remaining === 1 ? "Store" : "Stores"} remaining in your ${getPlanLabel(teamPlan)} plan.`}
			</p>
			{isLimitReached && (
				<Alert
					variant="destructive"
					className="mt-3 border-error-900/40 bg-error-900/10 text-error-900"
				>
					<AlertTitle className="text-[13px] font-semibold text-error-900">
						Maximum capacity reached
					</AlertTitle>
					<AlertDescription className="text-[12px] text-error-900/80">
						Delete an existing store or upgrade your plan in{" "}
						<Link className="underline" href="/settings/team">
							Team Settings
						</Link>{" "}
						to add more Data Stores.
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}

function DataStoreLockedCard() {
	return (
		<div className="text-center py-16 bg-surface rounded-lg border border-white/10">
			<h3 className="text-inverse text-lg font-medium">
				Data Stores are locked
			</h3>
			<p className="mt-2 text-text/60 text-sm max-w-xl mx-auto">
				Upgrade to the Pro or Team plan to connect PostgreSQL databases and use
				Data Stores in your agents.
			</p>
			<Link
				href="/settings/team"
				className="inline-flex mt-4 items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-inverse/80 hover:text-inverse"
			>
				View plans
			</Link>
		</div>
	);
}

function EmptyDataStoreCard() {
	return (
		<div className="text-center py-16 bg-surface rounded-lg">
			<EmptyState
				title="No data stores yet."
				description={
					'Please create a data store using the "New Data Store" button.'
				}
			/>
		</div>
	);
}

const PLAN_LABELS: Record<TeamPlan, string> = {
	free: "Free",
	pro: "Pro",
	team: "Team",
	enterprise: "Enterprise",
	internal: "Internal",
};

function getPlanLabel(plan: TeamPlan) {
	return PLAN_LABELS[plan];
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
