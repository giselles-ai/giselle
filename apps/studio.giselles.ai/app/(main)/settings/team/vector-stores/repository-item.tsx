"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import { EMBEDDING_PROFILES } from "@giselle-sdk/data-type";
import { formatTimestamp } from "@giselles-ai/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { MoreVertical, RefreshCw, Settings, Trash } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
	GitHubRepositoryContentType,
	GitHubRepositoryIndexStatus,
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
import type { DocumentLoaderErrorCode } from "./types";

// Status configuration for sync badges
const STATUS_CONFIG = {
	idle: { dotColor: "bg-[#B8E8F4]", label: "Idle" },
	running: { dotColor: "bg-[#39FF7F] animate-custom-pulse", label: "Running" },
	completed: { dotColor: "bg-[#39FF7F]", label: "Ready" },
	failed: { dotColor: "bg-[#FF3D71]", label: "Error" },
} as const;

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

	return (
		<div
			className={cn(
				"group relative rounded-[12px] overflow-hidden w-full bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none hover:border-white/12 transition-colors duration-200",
			)}
		>
			<div className="px-[24px] py-[16px]">
				{/* Repository Header */}
				<div className="flex items-center justify-between gap-4 mb-3">
					<a
						href={`https://github.com/${repositoryIndex.owner}/${repositoryIndex.repo}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-[#1663F3] font-medium text-[16px] leading-[22.4px] font-geist hover:text-[#0f4cd1] transition-colors duration-200"
					>
						{repositoryIndex.owner}/{repositoryIndex.repo}
					</a>
					<div className="flex items-center gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									aria-label="Repository actions menu"
									className="transition-opacity duration-200 p-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-md disabled:opacity-50"
									disabled={isPending || isIngesting}
								>
									<MoreVertical className="h-4 w-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-[180px] bg-black-850 border-[0.5px] border-black-400 rounded-[8px]"
							>
								<DropdownMenuItem
									onClick={handleManualIngest}
									disabled={!canManuallyIngest || isIngesting}
									className="flex items-center px-3 py-2 text-[14px] leading-[16px] text-white-400 hover:bg-white/5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Ingest Now
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setShowConfigureDialog(true)}
									className="flex items-center px-3 py-2 text-[14px] leading-[16px] text-white-400 hover:bg-white/5 rounded-md"
								>
									<Settings className="h-4 w-4 mr-2" />
									Configure Sources
								</DropdownMenuItem>
								<DropdownMenuSeparator className="my-1 h-px bg-white/10" />
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();
										setShowDeleteDialog(true);
									}}
									className="flex items-center px-3 py-2 text-[14px] leading-[16px] text-error-900 hover:bg-error-900/20 rounded-md"
								>
									<Trash className="h-4 w-4 mr-2" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Embedding Model Cards - Grid Layout */}
				<div className="grid grid-cols-3 gap-3 w-full">
					{embeddingProfileIds.map((profileId) => {
						const profile =
							EMBEDDING_PROFILES[profileId as keyof typeof EMBEDDING_PROFILES];
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
			</div>

			{/* Dialogs */}
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
		</div>
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
	profile?: (typeof EMBEDDING_PROFILES)[keyof typeof EMBEDDING_PROFILES];
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
									<SyncStatusBadge
										status={
											isIngesting && blobStatus.enabled
												? "running"
												: blobStatus.status
										}
										onVerify={
											blobStatus?.status === "failed" &&
											blobStatus?.errorCode === "DOCUMENT_NOT_FOUND"
												? onShowDiagnostic
												: undefined
										}
									/>
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
									<SyncStatusBadge
										status={
											isIngesting && pullRequestStatus.enabled
												? "running"
												: pullRequestStatus.status
										}
										onVerify={
											pullRequestStatus?.status === "failed" &&
											pullRequestStatus?.errorCode === "DOCUMENT_NOT_FOUND"
												? onShowDiagnostic
												: undefined
										}
									/>
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

function SyncStatusBadge({
	status,
	onVerify,
}: {
	status: GitHubRepositoryIndexStatus;
	onVerify?: () => void;
}) {
	const config = STATUS_CONFIG[status] ?? {
		dotColor: "bg-gray-500",
		label: "unknown",
	};

	const badgeContent = (
		<>
			<div className={`w-2 h-2 rounded-full ${config.dotColor} shrink-0`} />
			<span className="text-black-400 text-[12px] leading-[14px] font-medium font-geist flex-1 text-center ml-1.5">
				{config.label}
			</span>
			{status === "failed" && onVerify && (
				<>
					<span className="text-black-400 text-[12px] mx-1">•</span>
					<span className="text-[#1663F3] text-[12px] leading-[14px] font-medium font-geist">
						Check
					</span>
					<span className="text-[#1663F3] text-[10px] ml-0.5">↗</span>
				</>
			)}
		</>
	);

	if (onVerify) {
		return (
			<button
				type="button"
				aria-label="Verify repository status"
				onClick={onVerify}
				className="flex items-center px-2 py-1 rounded-full border border-white/20 w-auto hover:bg-white/5 transition-colors duration-200"
			>
				{badgeContent}
			</button>
		);
	}

	return (
		<div className="flex items-center px-2 py-1 rounded-full border border-white/20 w-[80px]">
			{badgeContent}
		</div>
	);
}
