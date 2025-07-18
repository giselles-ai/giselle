"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { MoreVertical, RefreshCw, Trash } from "lucide-react";
import { useState, useTransition } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GitHubRepositoryIndexStatus } from "@/drizzle";
import { cn } from "@/lib/utils";
import type { RepositoryWithStatuses } from "@/lib/vector-stores/github";
import { safeParseContentStatusMetadata } from "@/lib/vector-stores/github/types";
import type { GitHubRepositoryIndexId } from "@/packages/types";
import {
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "../components/glass-dialog-content";
import { DiagnosticModal } from "./diagnostic-modal";
import { getErrorMessage } from "./error-messages";
import type { DocumentLoaderErrorCode } from "./types";

type RepositoryItemProps = {
	repositoryIndex: RepositoryWithStatuses;
	deleteRepositoryIndexAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<void>;
	triggerManualIngestAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<{ success: boolean; error?: string }>;
};

export function RepositoryItem({
	repositoryIndex,
	deleteRepositoryIndexAction,
	triggerManualIngestAction,
}: RepositoryItemProps) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [isIngesting, startIngestTransition] = useTransition();

	const handleDelete = () => {
		startTransition(async () => {
			try {
				await deleteRepositoryIndexAction(repositoryIndex.repository.id);
				setShowDeleteDialog(false);
			} catch (error) {
				console.error(error);
			}
		});
	};

	const handleManualIngest = () => {
		startIngestTransition(async () => {
			try {
				const result = await triggerManualIngestAction(
					repositoryIndex.repository.id,
				);
				if (!result.success) {
					console.error("Failed to trigger manual ingest:", result.error);
				}
			} catch (error) {
				console.error("Error triggering manual ingest:", error);
			}
		});
	};

	// Get the blob status
	const blobStatus = repositoryIndex.contentStatuses.find(
		(cs) => cs.contentType === "blob",
	);

	if (!blobStatus) {
		throw new Error(
			`Repository ${repositoryIndex.repository.dbId} missing blob content status`,
		);
	}

	// Parse metadata
	const parseResult = safeParseContentStatusMetadata(
		blobStatus.metadata,
		"blob",
	);
	const parsedMetadata = parseResult.success ? parseResult.data : null;

	// Check if manual ingest is allowed
	const now = new Date();
	const canManuallyIngest =
		blobStatus.status === "idle" ||
		blobStatus.status === "completed" ||
		(blobStatus.status === "failed" &&
			blobStatus.retryAfter &&
			new Date(blobStatus.retryAfter) <= now);

	return (
		<div
			className={cn(
				"group relative rounded-[12px] overflow-hidden px-[24px] py-[16px] w-full bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none hover:border-white/12 transition-colors duration-200",
			)}
		>
			<div className="flex items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<a
						href={`https://github.com/${repositoryIndex.repository.owner}/${repositoryIndex.repository.repo}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-[#1663F3] font-medium text-[16px] leading-[22.4px] font-geist hover:text-[#0f4cd1] transition-colors duration-200"
					>
						{repositoryIndex.repository.owner}/{repositoryIndex.repository.repo}
					</a>

					<span className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
						Updated{" "}
						{getRelativeTimeString(repositoryIndex.repository.updatedAt)}
					</span>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex flex-col items-end gap-1">
						<StatusBadge
							status={isIngesting ? "running" : blobStatus.status}
							onVerify={
								blobStatus.status === "failed" &&
								blobStatus.errorCode === "DOCUMENT_NOT_FOUND"
									? () => setShowDiagnosticModal(true)
									: undefined
							}
						/>
						{parsedMetadata?.lastIngestedCommitSha && (
							<span className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
								Last Ingested:{" "}
								{parsedMetadata.lastIngestedCommitSha.substring(0, 7)}
							</span>
						)}
						{blobStatus.status === "failed" && blobStatus.errorCode && (
							<span className="text-red-400 font-medium text-[12px] leading-[20.4px] font-geist">
								{getErrorMessage(
									blobStatus.errorCode as DocumentLoaderErrorCode,
								)}
								{blobStatus.retryAfter &&
									` Retrying in ${formatRetryTime(blobStatus.retryAfter)}.`}
							</span>
						)}
					</div>
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
							className="w-[160px] bg-black-850 border-[0.5px] border-black-400 rounded-[8px]"
						>
							<DropdownMenuItem
								onClick={handleManualIngest}
								disabled={!canManuallyIngest || isIngesting}
								className="flex items-center px-3 py-2 text-[14px] leading-[16px] text-white-400 hover:bg-white/5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								Ingest Now
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
					<Dialog.Root
						open={showDeleteDialog}
						onOpenChange={setShowDeleteDialog}
					>
						<GlassDialogContent variant="destructive">
							<GlassDialogHeader
								title="Delete Repository"
								description={`This action cannot be undone. This will permanently delete the repository "${repositoryIndex.repository.owner}/${repositoryIndex.repository.repo}" from your Vector Stores.`}
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
				</div>
			</div>
			<DiagnosticModal
				repositoryIndex={repositoryIndex}
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
