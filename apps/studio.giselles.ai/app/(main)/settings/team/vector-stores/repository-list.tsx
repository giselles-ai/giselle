import { EmptyState } from "@giselle-internal/ui/empty-state";
import { SectionHeader } from "@giselle-internal/ui/section-header";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import type { GitHubRepositoryContentType } from "@/db";
import type { TeamPlan } from "@/db/schema";
import type { RepositoryWithStatuses } from "@/lib/vector-stores/github";
import type { GitHubRepositoryIndexId } from "@/packages/types";
import { OfficialRepositorySection } from "./official-repository-section";
import { RepositoryItem } from "./repository-item";

type RepositoryListProps = {
	repositories: RepositoryWithStatuses[];
	officialRepositories: RepositoryWithStatuses[];
	deleteRepositoryIndexAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<void>;
	triggerManualIngestAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<{ success: boolean; error?: string }>;
	updateRepositoryIndexAction: (
		repositoryIndexId: GitHubRepositoryIndexId,
		contentTypes: {
			contentType: GitHubRepositoryContentType;
			enabled: boolean;
		}[],
		embeddingProfileIds?: number[],
	) => Promise<{ success: boolean; error?: string }>;
	hasAccess: boolean;
	maxStores: number;
	teamPlan: TeamPlan;
};

export function RepositoryList({
	repositories,
	officialRepositories,
	deleteRepositoryIndexAction,
	triggerManualIngestAction,
	updateRepositoryIndexAction,
	hasAccess,
	maxStores,
	teamPlan,
}: RepositoryListProps) {
	const usageCount = repositories.length;
	return (
		<div className="flex flex-col gap-y-[16px]">
			<Card className="rounded-[8px] bg-transparent p-6 border-0">
				<SectionHeader
					title="GitHub Repositories"
					description="You can ingest your project's code into a Vector Store and use it in GitHub Vector Store Nodes."
					className="mb-0"
				/>
				<div className="my-4">
					<GitHubVectorStoreUsageNotice
						hasAccess={hasAccess}
						usageCount={usageCount}
						maxStores={maxStores}
						teamPlan={teamPlan}
					/>
				</div>

				{hasAccess ? (
					repositories.length > 0 ? (
						<div className="space-y-4">
							{repositories.map((repo) => (
								<RepositoryItem
									key={repo.repositoryIndex.id}
									repositoryData={repo}
									deleteRepositoryIndexAction={deleteRepositoryIndexAction}
									triggerManualIngestAction={triggerManualIngestAction}
									updateRepositoryIndexAction={updateRepositoryIndexAction}
								/>
							))}
						</div>
					) : (
						<EmptyRepositoryCard />
					)
				) : (
					<GitHubVectorStoreLockedCard />
				)}
			</Card>

			<OfficialRepositorySection repositories={officialRepositories} />
		</div>
	);
}

function GitHubVectorStoreUsageNotice({
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
					GitHub Vector Stores are not included in the {getPlanLabel(teamPlan)}{" "}
					plan
				</AlertTitle>
				<AlertDescription className="text-[12px] text-error-900/80">
					Upgrade to{" "}
					<Link className="underline" href="/settings/team">
						Pro or Team
					</Link>{" "}
					to ingest repositories with GitHub Vector Stores.
				</AlertDescription>
			</Alert>
		);
	}

	const remaining = Math.max(maxStores - usageCount, 0);
	const limitReached = remaining === 0;

	return (
		<div>
			<div className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-[13px] text-text/70">
				<span>GitHub Vector Stores used</span>
				<span>-</span>
				{!limitReached && (
					<span className="text-[12px] text-text/60">
						{remaining} GitHub Vector {remaining === 1 ? "Store" : "Stores"}{" "}
						remaining in your {getPlanLabel(teamPlan)} plan.
					</span>
				)}
				{limitReached && (
					<span className="text-[12px] text-text/60">
						You've used all GitHub Vector Stores included in your{" "}
						{getPlanLabel(teamPlan)} plan.
					</span>
				)}
				<span className="ml-auto font-semibold text-inverse">
					{usageCount} / {maxStores}
				</span>
			</div>
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
						to add more GitHub Vector Stores.
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}

function EmptyRepositoryCard() {
	return (
		<div className="text-center py-16 bg-surface rounded-lg">
			<EmptyState
				title="No repositories are registered."
				description='Please register a repository using the "Register Repository" button.'
			/>
		</div>
	);
}

function GitHubVectorStoreLockedCard() {
	return (
		<div className="text-center py-16 bg-surface rounded-lg border border-white/10">
			<h3 className="text-inverse text-lg font-medium">
				GitHub Vector Stores are locked
			</h3>
			<p className="mt-2 text-text/60 text-sm max-w-xl mx-auto">
				Upgrade to the Pro or Team plan to ingest repositories and connect
				GitHub Vector Stores to your agents.
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
