"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
	Code,
	GitPullRequest,
	MoreVertical,
	RefreshCw,
	Settings,
	Trash,
} from "lucide-react";
import { useState, useTransition } from "react";
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
import { getContentStatusMetadata } from "@/lib/vector-stores/github/types";
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

type RepositoryItemProps = {
	repositoryData: RepositoryWithStatuses;
	deleteRepositoryIndexAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<void>;
	triggerManualIngestAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<{ success: boolean; error?: string }>;
	updateRepositoryContentTypesAction: (
		repositoryIndexId: string,
		contentTypes: {
			contentType: GitHubRepositoryContentType;
			enabled: boolean;
		}[],
	) => Promise<{ success: boolean; error?: string }>;
};

export function RepositoryItem({
	repositoryData,
	deleteRepositoryIndexAction,
	triggerManualIngestAction,
	updateRepositoryContentTypesAction,
}: RepositoryItemProps) {
	const { repositoryIndex, contentStatuses } = repositoryData;
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

	// Get content statuses
	const blobStatus = contentStatuses.find((cs) => cs.contentType === "blob");
	const pullRequestStatus = contentStatuses.find(
		(cs) => cs.contentType === "pull_request",
	);

	if (!blobStatus) {
		throw new Error(
			`Repository ${repositoryIndex.dbId} missing blob content status`,
		);
	}

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
				<div className="flex items-center justify-between gap-4 mb-4">
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
								<Dialog.Root
									open={showDeleteDialog}
									onOpenChange={setShowDeleteDialog}
								>
									<Dialog.Trigger asChild>
										<DropdownMenuItem
											onClick={() => setShowDeleteDialog(true)}
											className="flex items-center px-3 py-2 text-[14px] leading-[16px] text-error-900 hover:bg-error-900/20 rounded-md"
										>
											<Trash className="h-4 w-4 mr-2" />
											Delete
										</DropdownMenuItem>
									</Dialog.Trigger>
								</Dialog.Root>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Content Type Sections */}
				<div className="space-y-3">
					{/* Code Section */}
					{blobStatus && (
						<ContentTypeSection
							contentType="blob"
							status={blobStatus}
							isIngesting={isIngesting}
							onVerify={
								blobStatus.status === "failed" &&
								blobStatus.errorCode === "DOCUMENT_NOT_FOUND"
									? () => setShowDiagnosticModal(true)
									: undefined
							}
						/>
					)}

					{/* Pull Requests Section */}
					<ContentTypeSection
						contentType="pull_request"
						status={pullRequestStatus}
						isIngesting={isIngesting}
					/>
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
				updateRepositoryContentTypesAction={updateRepositoryContentTypesAction}
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

function getRelativeTimeString(date: Date): string {
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInSeconds = Math.floor(diffInMs / 1000);
	const diffInMinutes = Math.floor(diffInSeconds / 60);
	const diffInHours = Math.floor(diffInMinutes / 60);
	const diffInDays = Math.floor(diffInHours / 24);

	if (diffInDays > 7) {
		return date.toLocaleDateString("en-US");
	}
	if (diffInDays >= 1) {
		return diffInDays === 1 ? "yesterday" : `${diffInDays} days ago`;
	}
	if (diffInHours >= 1) {
		return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
	}
	if (diffInMinutes >= 1) {
		return diffInMinutes === 1
			? "1 minute ago"
			: `${diffInMinutes} minutes ago`;
	}
	return "just now";
}

const STATUS_CONFIG = {
	idle: { dotColor: "bg-[#B8E8F4]", label: "Idle" },
	running: { dotColor: "bg-[#39FF7F] animate-custom-pulse", label: "Running" },
	completed: { dotColor: "bg-[#39FF7F]", label: "Ready" },
	failed: { dotColor: "bg-[#FF3D71]", label: "Error" },
} as const;

function StatusBadge({
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

function formatRetryTime(retryAfter: Date): string {
	const now = new Date();
	const diffMs = retryAfter.getTime() - now.getTime();

	if (diffMs <= 0) {
		return "now";
	}

	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);

	if (diffHours > 0) {
		return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
	}
	if (diffMinutes > 0) {
		return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
	}
	return `${diffSeconds} second${diffSeconds > 1 ? "s" : ""}`;
}

// Content Type Section Component
type ContentTypeSectionProps = {
	contentType: GitHubRepositoryContentType;
	status?: typeof githubRepositoryContentStatus.$inferSelect;
	isIngesting: boolean;
	onVerify?: () => void;
};

function ContentTypeSection({
	contentType,
	status,
	isIngesting,
	onVerify,
}: ContentTypeSectionProps) {
	// Handle case where status doesn't exist (e.g., pull_request not yet configured)
	if (!status) {
		const contentConfig = {
			blob: { icon: Code, label: "Code" },
			pull_request: { icon: GitPullRequest, label: "Pull Requests" },
		};
		const config = contentConfig[contentType];
		const Icon = config.icon;

		return (
			<div className="bg-black-700/50 rounded-lg p-3 opacity-50">
				<div className="flex items-center justify-between mb-1">
					<div className="flex items-center gap-2 text-sm font-medium text-gray-300">
						<Icon size={16} />
						<span>{config.label}</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="bg-gray-600 text-gray-300 px-2 py-0.5 rounded text-xs">
							Disabled
						</span>
					</div>
				</div>
				<div className="text-xs text-gray-500">
					<span>Not configured</span>
				</div>
			</div>
		);
	}

	const {
		enabled,
		status: syncStatus,
		lastSyncedAt,
		metadata,
		errorCode,
		retryAfter,
	} = status;

	// Parse metadata based on content type
	const parsedMetadata = getContentStatusMetadata(metadata, contentType);

	// Content type config
	const contentConfig = {
		blob: {
			icon: Code,
			label: "Code",
			metadataLabel:
				parsedMetadata && "lastIngestedCommitSha" in parsedMetadata
					? `Commit: ${parsedMetadata.lastIngestedCommitSha?.substring(0, 7) || "none"}`
					: null,
		},
		pull_request: {
			icon: GitPullRequest,
			label: "Pull Requests",
			metadataLabel:
				parsedMetadata && "lastIngestedPrNumber" in parsedMetadata
					? `PR: #${parsedMetadata.lastIngestedPrNumber || "none"}`
					: null,
		},
	};

	const config = contentConfig[contentType];
	const Icon = config.icon;

	// Determine display status
	const displayStatus = isIngesting && enabled ? "running" : syncStatus;

	return (
		<div className="bg-black-700/50 rounded-lg p-3">
			<div className="flex items-center justify-between mb-1">
				<div className="flex items-center gap-2 text-sm font-medium text-gray-300">
					<Icon size={16} />
					<span>{config.label}</span>
				</div>
				<div className="flex items-center gap-2">
					{enabled ? (
						<span className="bg-green-700 text-white px-2 py-0.5 rounded text-xs">
							Enabled
						</span>
					) : (
						<span className="bg-gray-600 text-gray-300 px-2 py-0.5 rounded text-xs">
							Disabled
						</span>
					)}
					{enabled && (
						<StatusBadge
							status={displayStatus}
							onVerify={
								syncStatus === "failed" && onVerify ? onVerify : undefined
							}
						/>
					)}
				</div>
			</div>
			{enabled && (
				<div className="text-xs text-gray-500 flex justify-between">
					{lastSyncedAt ? (
						<span>Last sync: {getRelativeTimeString(lastSyncedAt)}</span>
					) : (
						<span>Never synced</span>
					)}
					{config.metadataLabel && <span>{config.metadataLabel}</span>}
				</div>
			)}
			{enabled && syncStatus === "failed" && errorCode && (
				<div className="text-xs text-red-400 mt-1">
					{getErrorMessage(errorCode as DocumentLoaderErrorCode)}
					{retryAfter && ` • Retry in ${formatRetryTime(retryAfter)}`}
				</div>
			)}
		</div>
	);
}
