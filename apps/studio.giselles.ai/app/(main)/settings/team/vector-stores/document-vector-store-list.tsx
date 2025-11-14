import { EmptyState } from "@giselle-internal/ui/empty-state";
import { SectionHeader } from "@giselle-internal/ui/section-header";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import type { TeamPlan } from "@/db/schema";
import type { DocumentVectorStoreId } from "@/packages/types";
import type { DocumentVectorStoreWithProfiles } from "./data";
import { DocumentVectorStoreItem } from "./document/document-vector-store-item";
import type { ActionResult, DocumentVectorStoreUpdateInput } from "./types";

type DocumentVectorStoreListProps = {
	stores: DocumentVectorStoreWithProfiles[];
	deleteAction: (
		documentVectorStoreId: DocumentVectorStoreId,
	) => Promise<ActionResult>;
	updateAction: (
		documentVectorStoreId: DocumentVectorStoreId,
		input: DocumentVectorStoreUpdateInput,
	) => Promise<ActionResult>;
	hasAccess: boolean;
	maxStores: number;
	teamPlan: TeamPlan;
};

export function DocumentVectorStoreList({
	stores,
	deleteAction,
	updateAction,
	hasAccess,
	maxStores,
	teamPlan,
}: DocumentVectorStoreListProps) {
	const usageCount = stores.length;
	return (
		<div className="flex flex-col gap-y-[16px]">
			<Card className="rounded-[8px] bg-transparent p-6 border-0">
				<SectionHeader
					title="Document Vector Stores"
					description="Manage data that can be ingested by Document Vector Store Nodes."
					className="mb-0"
				/>
				<div className="my-4">
					<DocumentVectorStoreUsageNotice
						hasAccess={hasAccess}
						usageCount={usageCount}
						maxStores={maxStores}
						teamPlan={teamPlan}
					/>
				</div>

				{hasAccess ? (
					stores.length > 0 ? (
						<div className="space-y-4">
							{stores.map((store) => (
								<DocumentVectorStoreItem
									key={store.id}
									store={store}
									deleteAction={deleteAction}
									updateAction={updateAction}
								/>
							))}
						</div>
					) : (
						<EmptyDocumentVectorStoreCard />
					)
				) : (
					<DocumentVectorStoreLockedCard />
				)}
			</Card>
		</div>
	);
}

function DocumentVectorStoreUsageNotice({
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
					Document Vector Stores are not included in the{" "}
					{getPlanLabel(teamPlan)} plan
				</AlertTitle>
				<AlertDescription className="text-[12px] text-error-900/80">
					Upgrade to{" "}
					<Link className="underline" href="/settings/team">
						Pro or Team
					</Link>{" "}
					to ingest documents with Vector Stores.
				</AlertDescription>
			</Alert>
		);
	}

	const remaining = Math.max(maxStores - usageCount, 0);
	const limitReached = remaining === 0;

	return (
		<div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
			<div className="flex items-center justify-between text-[13px] text-text/70">
				<span>Document Vector Stores used</span>
				<span className="font-semibold text-inverse">
					{usageCount} / {maxStores}
				</span>
			</div>
			<p className="mt-1 text-[12px] text-text/60">
				{limitReached
					? `You've used all Document Vector Stores included in your ${getPlanLabel(teamPlan)} plan.`
					: `${remaining} Document Vector ${remaining === 1 ? "Store" : "Stores"} remaining in your ${getPlanLabel(teamPlan)} plan.`}
			</p>
			{limitReached && (
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
						to add more Document Vector Stores.
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}

function DocumentVectorStoreLockedCard() {
	return (
		<div className="text-center py-16 bg-surface rounded-lg border border-white/10">
			<h3 className="text-inverse text-lg font-medium">
				Document Vector Stores are locked
			</h3>
			<p className="mt-2 text-text/60 text-sm max-w-xl mx-auto">
				Upgrade to Pro or Team to ingest knowledge bases and connect Document
				Vector Stores to your agents.
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

function EmptyDocumentVectorStoreCard() {
	return (
		<div className="text-center py-16 bg-surface rounded-lg">
			<EmptyState
				title="No document vector stores yet."
				description='Please create a vector store using the "New Vector Store" button.'
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
