"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Trash } from "lucide-react";
import { useState, useTransition } from "react";
import type {
	GitHubRepositoryIndexStatus,
	githubRepositoryIndex,
} from "@/drizzle";
import { cn } from "@/lib/utils";
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
	repositoryIndex: typeof githubRepositoryIndex.$inferSelect;
	deleteRepositoryIndexAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<void>;
};

export function RepositoryItem({
	repositoryIndex,
	deleteRepositoryIndexAction,
}: RepositoryItemProps) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
	const [isPending, startTransition] = useTransition();

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

	return (
		<div
			className={cn(
				"group relative rounded-[12px] overflow-hidden px-[24px] py-[16px] w-full bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none hover:border-white/12 transition-colors duration-200",
			)}
		>
			<div className="flex items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<a
						href={`https://github.com/${repositoryIndex.owner}/${repositoryIndex.repo}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-[#1663F3] font-medium text-[16px] leading-[22.4px] font-geist hover:text-[#0f4cd1] transition-colors duration-200"
					>
						{repositoryIndex.owner}/{repositoryIndex.repo}
					</a>

					<span className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
						Updated {getRelativeTimeString(repositoryIndex.updatedAt)}
					</span>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex flex-col items-end gap-1">
						<StatusBadge
							status={repositoryIndex.status}
							onVerify={
								repositoryIndex.status === "failed" &&
								repositoryIndex.errorCode === "DOCUMENT_NOT_FOUND"
									? () => setShowDiagnosticModal(true)
									: undefined
							}
						/>
						{repositoryIndex.lastIngestedCommitSha && (
							<span className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
								Last Ingested:{" "}
								{repositoryIndex.lastIngestedCommitSha.substring(0, 7)}
							</span>
						)}
						{repositoryIndex.status === "failed" &&
							repositoryIndex.errorCode && (
								<span className="text-red-400 font-medium text-[12px] leading-[20.4px] font-geist">
									{getErrorMessage(
										repositoryIndex.errorCode as DocumentLoaderErrorCode,
									)}
									{repositoryIndex.retryAfter &&
										` Retrying in ${formatRetryTime(repositoryIndex.retryAfter)}.`}
								</span>
							)}
					</div>
					<Dialog.Root
						open={showDeleteDialog}
						onOpenChange={setShowDeleteDialog}
					>
						<Dialog.Trigger asChild>
							<button
								type="button"
								className="transition-opacity duration-200 p-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-md disabled:opacity-50"
								disabled={isPending}
								onClick={() => setShowDeleteDialog(true)}
							>
								<Trash className="h-4 w-4" />
							</button>
						</Dialog.Trigger>
						<GlassDialogContent variant="destructive">
							<GlassDialogHeader
								title="Delete Repository"
								description={`This action cannot be undone. This will permanently delete the repository "${repositoryIndex.owner}/${repositoryIndex.repo}".`}
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
				onOpenChange={setShowDiagnosticModal}
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
	idle: { dotColor: "bg-[#B8E8F4]", label: "idle" },
	running: { dotColor: "bg-[#39FF7F] animate-custom-pulse", label: "running" },
	completed: { dotColor: "bg-[#39FF7F]", label: "ready" },
	failed: { dotColor: "bg-[#FF3D71]", label: "error" },
} as const;

const BADGE_STYLES = {
	button:
		"flex items-center px-2 py-1 rounded-full border border-white/20 w-auto hover:bg-white/5 transition-colors duration-200",
	container:
		"flex items-center px-2 py-1 rounded-full border border-white/20 w-[80px]",
	dot: "w-2 h-2 rounded-full shrink-0",
	text: "text-black-400 text-[12px] leading-[14px] font-medium font-geist flex-1 text-center ml-1.5",
	checkText: "text-[#1663F3] text-[12px] leading-[14px] font-medium font-geist",
	checkIcon: "text-[#1663F3] text-[10px] ml-0.5",
	separator: "text-black-400 text-[12px] mx-1",
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
			<div className={`${BADGE_STYLES.dot} ${config.dotColor}`} />
			<span className={BADGE_STYLES.text}>{config.label}</span>
			{status === "failed" && onVerify && (
				<>
					<span className={BADGE_STYLES.separator}>•</span>
					<span className={BADGE_STYLES.checkText}>Check</span>
					<span className={BADGE_STYLES.checkIcon}>↗</span>
				</>
			)}
		</>
	);

	if (onVerify) {
		return (
			<button type="button" onClick={onVerify} className={BADGE_STYLES.button}>
				{badgeContent}
			</button>
		);
	}

	return <div className={BADGE_STYLES.container}>{badgeContent}</div>;
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
