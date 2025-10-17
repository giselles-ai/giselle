"use client";

import { AccentLink } from "@giselle-internal/ui/accent-link";
import { GlassCard } from "@giselle-internal/ui/glass-card";
import { RepoActionMenu } from "@giselle-internal/ui/repo-action-menu";
import { StatusBadge } from "@giselle-internal/ui/status-badge";
import { StatusIndicator } from "@giselle-internal/ui/status-indicator";
import { formatTimestamp } from "@giselles-ai/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { RefreshCw, Settings, Trash } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type {
	GitHubRepositoryContentType,
	githubRepositoryContentStatus,
} from "@/drizzle";
import { cn } from "@/lib/utils";
import type { RepositoryWithStatuses } from "@/lib/vector-stores/github";
import type { GitHubRepositoryIndexId } from "@/packages/types";
import {
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "../components/glass-dialog-content";
import { ConfigureSourcesDialog } from "./configure-sources-dialog";
import { DiagnosticModal } from "./diagnostic-modal";
import { getErrorMessage } from "./error-messages";
import { GITHUB_EMBEDDING_PROFILES } from "./github-embedding-profiles";
import type { DocumentLoaderErrorCode } from "./types";

type RepositoryItemProps = {
	repositoryData: RepositoryWithStatuses;
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
};

export function RepositoryItem({
	repositoryData,
	deleteRepositoryIndexAction,
	triggerManualIngestAction,
	updateRepositoryIndexAction,
}: RepositoryItemProps) {
	const { repositoryIndex, contentStatuses } = repositoryData;

	// Derive unique embedding profile IDs from content statuses
	const embeddingProfileIds = useMemo(
		() =>
			[...new Set(contentStatuses.map((cs) => cs.embeddingProfileId))].sort(
				(a, b) => a - b,
			),
		[contentStatuses],
	);

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showConfigureDialog, setShowConfigureDialog] = useState(false);
	const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [isIngesting, startIngestTransition] = useTransition();
	//

	const handleDelete = () => {
		startTransition(async () => {
			try {
				await deleteRepositoryIndexAction(repositoryIndex.id);
				setShowDeleteDialog(false);
			} catch (error) {
				console.error(error);
			}
		});
	};

	const handleManualIngest = () => {
		startIngestTransition(async () => {
			try {
				const result = await triggerManualIngestAction(repositoryIndex.id);
				if (!result.success) {
					console.error("Failed to trigger manual ingest:", result.error);
				}
			} catch (error) {
				console.error("Error triggering manual ingest:", error);
			}
		});
	};

	// Check if manual ingest is allowed for any enabled content type
	const now = new Date();
	const canManuallyIngest = contentStatuses.some((cs) => {
		if (!cs.enabled) return false;
		return (
			cs.status === "idle" ||
			cs.status === "completed" ||
			(cs.status === "failed" &&
				cs.retryAfter &&
				new Date(cs.retryAfter) <= now)
		);
	});

	//

	return (
		<GlassCard className={cn("group")} paddingClassName="px-[24px] py-[16px]">
			{/* Repository Header + Cards in one row: [name] [cards...] [menu] */}
			{/* Row 1: Link + Menu */}
			<div className="flex items-center justify-between gap-4 mb-3">
				<AccentLink
					href={`https://github.com/${repositoryIndex.owner}/${repositoryIndex.repo}`}
					target="_blank"
					rel="noopener noreferrer"
					className="font-medium text-[16px] leading-[22.4px] font-geist"
				>
					{repositoryIndex.owner}/{repositoryIndex.repo}
				</AccentLink>
				<RepoActionMenu
					id={`repo-actions-${repositoryIndex.id}`}
					disabled={isPending || isIngesting}
					actions={[
						{
							value: "ingest",
							label: "Ingest Now",
							icon: <RefreshCw className="h-4 w-4" />,
							disabled: !canManuallyIngest || isIngesting,
							onSelect: handleManualIngest,
						},
						{
							value: "configure",
							label: "Configure Sources",
							icon: <Settings className="h-4 w-4" />,
							onSelect: () => setShowConfigureDialog(true),
						},
						{
							value: "delete",
							label: "Delete",
							icon: <Trash className="h-4 w-4 text-error-900" />,
							destructive: true,
							onSelect: () => setShowDeleteDialog(true),
						},
					]}
				/>
			</div>
			{/* Row 2: Cards grid */}
			<div className="grid grid-cols-3 gap-3 w-full">
				{embeddingProfileIds.map((profileId) => {
					const profile =
						GITHUB_EMBEDDING_PROFILES[
							profileId as keyof typeof GITHUB_EMBEDDING_PROFILES
						];
					return (
						<EmbeddingModelCard
							key={profileId}
							profile={profile}
							profileId={profileId}
							contentStatuses={contentStatuses}
							isIngesting={isIngesting}
							onShowDiagnostic={() => setShowDiagnosticModal(true)}
						/>
					);
				})}
			</div>
			<Dialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<GlassDialogContent variant="destructive">
					<GlassDialogHeader
						title="Delete Repository"
						description={`This action cannot be undone. This will permanently delete the repository "${repositoryIndex.owner}/${repositoryIndex.repo}" from your Vector Stores.`}
						onClose={() => setShowDeleteDialog(false)}
						variant="destructive"
					/>
					<GlassDialogFooter
						onCancel={() => setShowDeleteDialog(false)}
						onConfirm={handleDelete}
						confirmLabel="Delete"
						isPending={isPending}
						variant="destructive"
					/>
				</GlassDialogContent>
			</Dialog.Root>

			<ConfigureSourcesDialog
				open={showConfigureDialog}
				setOpen={setShowConfigureDialog}
				repositoryData={repositoryData}
				updateRepositoryIndexAction={updateRepositoryIndexAction}
				enabledProfiles={embeddingProfileIds}
			/>

			<DiagnosticModal
				repositoryData={repositoryData}
				open={showDiagnosticModal}
				setOpen={setShowDiagnosticModal}
				onComplete={() => {
					// Refresh will happen via revalidatePath in the action
				}}
				onDelete={() => handleDelete()}
			/>
		</GlassCard>
	);
}

// Embedding Model Card Component
function EmbeddingModelCard({
	profile,
	profileId,
	contentStatuses,
	isIngesting,
	onShowDiagnostic,
}: {
	profile?: (typeof GITHUB_EMBEDDING_PROFILES)[keyof typeof GITHUB_EMBEDDING_PROFILES];
	profileId: number;
	contentStatuses: (typeof githubRepositoryContentStatus.$inferSelect)[];
	isIngesting: boolean;
	onShowDiagnostic: () => void;
}) {
	// Filter statuses for this embedding profile
	const profileStatuses = contentStatuses.filter(
		(cs) => cs.embeddingProfileId === profileId,
	);

	// Get status for each content type
	const blobStatus = profileStatuses.find((cs) => cs.contentType === "blob");
	const pullRequestStatus = profileStatuses.find(
		(cs) => cs.contentType === "pull_request",
	);

	return (
		<div
			className="rounded-lg p-3 min-h-0 w-full"
			style={{
				background: "linear-gradient(180deg, #202530 0%, #12151f 100%)",
				border: "0.5px solid rgba(255, 255, 255, 0.15)",
				boxShadow: "0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
			}}
		>
			{/* Model Header */}
			<div className="mb-3">
				<div className="text-xs text-white/80 font-medium mb-2">
					{profile?.name || `Profile ${profileId}`}
				</div>
			</div>

			{/* Content Type Status - Compact Layout */}
			<div className="space-y-3 text-xs">
				{/* Code Section */}
				<div>
					<div className="flex items-center justify-between">
						<span className="text-gray-300">Code</span>
						<div className="flex items-center gap-2">
							{blobStatus?.enabled ? (
								blobStatus.status === "completed" ? (
									<StatusBadge status="success" variant="dot">
										Enabled
									</StatusBadge>
								) : (
									<div className="flex items-center gap-2">
										<div className="flex items-center px-2 py-1 rounded-full border border-border-muted">
											<StatusIndicator
												status={
													isIngesting && blobStatus.enabled
														? "running"
														: blobStatus.status
												}
												size="sm"
												showLabel={false}
											/>
											<span
												className={`text-[12px] leading-[14px] font-medium font-geist flex-1 text-center ml-1.5 ${
													blobStatus.status === "failed"
														? "text-error-900"
														: "text-black-400"
												}`}
											>
												{isIngesting && blobStatus.enabled
													? "Running"
													: blobStatus.status === "idle"
														? "Idle"
														: "Error"}
											</span>
										</div>
										{blobStatus?.status === "failed" &&
											blobStatus?.errorCode === "DOCUMENT_NOT_FOUND" && (
												<button
													type="button"
													onClick={onShowDiagnostic}
													className="text-[#1663F3] text-[12px] leading-[14px] font-medium font-geist hover:underline"
												>
													Check ↗
												</button>
											)}
									</div>
								)
							) : (
								<StatusBadge status="ignored" variant="dot">
									Disabled
								</StatusBadge>
							)}
						</div>
					</div>
					{blobStatus?.enabled && (
						<div className="text-[10px] text-gray-500 flex justify-between">
							<span>
								{blobStatus.lastSyncedAt
									? `Last sync: ${formatTimestamp.toRelativeTime(new Date(blobStatus.lastSyncedAt).getTime())}`
									: "Never synced"}
							</span>
							{blobStatus.metadata &&
								(() => {
									const metadata = blobStatus.metadata;
									if (
										metadata &&
										"lastIngestedCommitSha" in metadata &&
										metadata.lastIngestedCommitSha
									) {
										return (
											<span>
												Commit: {metadata.lastIngestedCommitSha.substring(0, 7)}
											</span>
										);
									}
									return null;
								})()}
						</div>
					)}
					{blobStatus?.enabled &&
						blobStatus.status === "failed" &&
						blobStatus.errorCode && (
							<div className="text-xs text-red-400 mt-1">
								{getErrorMessage(
									blobStatus.errorCode as DocumentLoaderErrorCode,
								)}
								{blobStatus.retryAfter &&
									` • Retry ${formatTimestamp.toRelativeTime(new Date(blobStatus.retryAfter).getTime())}`}
							</div>
						)}
				</div>

				{/* Pull Requests Section */}
				<div>
					<div className="flex items-center justify-between">
						<span className="text-gray-300">Pull Requests</span>
						<div className="flex items-center gap-2">
							{pullRequestStatus?.enabled ? (
								pullRequestStatus.status === "completed" ? (
									<StatusBadge status="success" variant="dot">
										Enabled
									</StatusBadge>
								) : (
									<div className="flex items-center gap-2">
										<div className="flex items-center px-2 py-1 rounded-full border border-border-muted">
											<StatusIndicator
												status={
													isIngesting && pullRequestStatus.enabled
														? "running"
														: pullRequestStatus.status
												}
												size="sm"
												showLabel={false}
											/>
											<span
												className={`text-[12px] leading-[14px] font-medium font-geist flex-1 text-center ml-1.5 ${
													pullRequestStatus.status === "failed"
														? "text-error-900"
														: "text-black-400"
												}`}
											>
												{isIngesting && pullRequestStatus.enabled
													? "Running"
													: pullRequestStatus.status === "idle"
														? "Idle"
														: "Error"}
											</span>
										</div>
										{pullRequestStatus?.status === "failed" &&
											pullRequestStatus?.errorCode === "DOCUMENT_NOT_FOUND" && (
												<button
													type="button"
													onClick={onShowDiagnostic}
													className="text-[#1663F3] text-[12px] leading-[14px] font-medium font-geist hover:underline"
												>
													Check ↗
												</button>
											)}
									</div>
								)
							) : (
								<StatusBadge status="ignored" variant="dot">
									Disabled
								</StatusBadge>
							)}
						</div>
					</div>
					{pullRequestStatus?.enabled && (
						<div className="text-[10px] text-gray-500 flex justify-between">
							<span>
								{pullRequestStatus.lastSyncedAt
									? `Last sync: ${formatTimestamp.toRelativeTime(new Date(pullRequestStatus.lastSyncedAt).getTime())}`
									: "Never synced"}
							</span>
							{pullRequestStatus.metadata &&
								(() => {
									const metadata = pullRequestStatus.metadata;
									if (
										metadata &&
										"lastIngestedPrNumber" in metadata &&
										metadata.lastIngestedPrNumber
									) {
										return <span>PR: #{metadata.lastIngestedPrNumber}</span>;
									}
									return null;
								})()}
						</div>
					)}
					{pullRequestStatus?.enabled &&
						pullRequestStatus.status === "failed" &&
						pullRequestStatus.errorCode && (
							<div className="text-xs text-red-400 mt-1">
								{getErrorMessage(
									pullRequestStatus.errorCode as DocumentLoaderErrorCode,
								)}
								{pullRequestStatus.retryAfter &&
									` • Retry ${formatTimestamp.toRelativeTime(new Date(pullRequestStatus.retryAfter).getTime())}`}
							</div>
						)}
					{!pullRequestStatus?.enabled && pullRequestStatus === undefined && (
						<div className="text-[10px] text-gray-500">Not configured</div>
					)}
				</div>
			</div>
		</div>
	);
}
