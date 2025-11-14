"use client";

import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { Toggle } from "@giselle-internal/ui/toggle";
import { CircleDot, Code, GitPullRequest, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type {
	GitHubRepositoryContentType,
	githubRepositoryContentStatus,
} from "@/db";
import type { RepositoryWithStatuses } from "@/lib/vector-stores/github";
import type { GitHubRepositoryIndexId } from "@/packages/types";
import { GITHUB_EMBEDDING_PROFILES } from "./github-embedding-profiles";

type ConfigureSourcesDialogProps = {
	open: boolean;
	setOpen: (open: boolean) => void;
	repositoryData: RepositoryWithStatuses;
	updateRepositoryIndexAction: (
		repositoryIndexId: GitHubRepositoryIndexId,
		contentTypes: {
			contentType: GitHubRepositoryContentType;
			enabled: boolean;
		}[],
		embeddingProfileIds?: number[],
	) => Promise<{ success: boolean; error?: string }>;
	enabledProfiles?: number[];
};

export function ConfigureSourcesDialog({
	open,
	setOpen,
	repositoryData,
	updateRepositoryIndexAction,
	enabledProfiles = [1],
}: ConfigureSourcesDialogProps) {
	const { repositoryIndex, contentStatuses } = repositoryData;
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState("");

	// Initialize state with current status
	const blobStatus = contentStatuses.find((cs) => cs.contentType === "blob");
	const pullRequestStatus = contentStatuses.find(
		(cs) => cs.contentType === "pull_request",
	);
	const issueStatus = contentStatuses.find((cs) => cs.contentType === "issue");

	const [config, setConfig] = useState({
		code: { enabled: blobStatus?.enabled ?? true },
		pullRequests: { enabled: pullRequestStatus?.enabled ?? false },
		issues: { enabled: issueStatus?.enabled ?? false },
	});

	const [selectedProfiles, setSelectedProfiles] =
		useState<number[]>(enabledProfiles);

	// Reset profiles when dialog opens
	useEffect(() => {
		if (open) {
			setSelectedProfiles(enabledProfiles);
		}
	}, [open, enabledProfiles]);

	const handleSave = () => {
		setError("");
		startTransition(async () => {
			const contentTypes: {
				contentType: GitHubRepositoryContentType;
				enabled: boolean;
			}[] = [
				{ contentType: "blob", enabled: config.code.enabled },
				{ contentType: "pull_request", enabled: config.pullRequests.enabled },
				{ contentType: "issue", enabled: config.issues.enabled },
			];

			const result = await updateRepositoryIndexAction(
				repositoryIndex.id,
				contentTypes,
				selectedProfiles,
			);

			if (!result.success) {
				setError(result.error || "Failed to update repository settings");
				return;
			}

			setOpen(false);
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent
				variant="glass"
				className="max-w-[600px]"
				onEscapeKeyDown={() => setOpen(false)}
				onPointerDownOutside={() => setOpen(false)}
			>
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="font-sans text-[20px] font-medium tracking-tight text-inverse">
							Configure Vector Stores
						</DialogTitle>
						<DialogClose
							onClick={() => setOpen(false)}
							className="rounded-sm text-inverse opacity-70 hover:opacity-100 focus:outline-none"
						>
							<X className="h-5 w-5" />
							<span className="sr-only">Close</span>
						</DialogClose>
					</div>
					<DialogDescription className="font-geist mt-2 text-[14px] text-text-muted">
						Configure sources and embedding models for this repository
					</DialogDescription>
				</DialogHeader>
				<DialogBody className="mt-4">
					<div className="space-y-6">
						{/* Repository Section */}
						<div>
							<h3 className="text-text text-[14px] leading-[16.8px] font-sans">
								Repository
							</h3>
							<div className="mt-2 flex items-center rounded-full bg-surface pl-[16px] pr-[16px] py-2 text-white-200 transition-colors text-[12px]">
								<div className="space-x-[2px]">
									<span>{repositoryIndex.owner}</span>
									<span>/</span>
									<span>{repositoryIndex.repo}</span>
								</div>
							</div>
						</div>
						{/* Sources Section */}
						<div>
							<h3 className="text-text text-[14px] leading-[16.8px] font-sans mb-2">
								Sources to Ingest
							</h3>
							<div className="flex flex-col gap-3">
								{/* Code Configuration */}
								<ContentTypeToggle
									icon={Code}
									label="Code"
									description="Ingest source code files from the repository"
									enabled={config.code.enabled}
									onToggle={(enabled) =>
										setConfig({ ...config, code: { enabled } })
									}
									disabled={true} // Code is mandatory
									status={blobStatus}
								/>

								{/* Pull Requests Configuration */}
								<ContentTypeToggle
									icon={GitPullRequest}
									label="Pull Requests"
									description="Ingest merged pull request content and discussions"
									enabled={config.pullRequests.enabled}
									onToggle={(enabled) =>
										setConfig({ ...config, pullRequests: { enabled } })
									}
									status={pullRequestStatus}
								/>

								{/* Issues Configuration */}
								<ContentTypeToggle
									icon={CircleDot}
									label="Issues"
									description="Index issue titles, descriptions, and comments"
									enabled={config.issues.enabled}
									onToggle={(enabled) =>
										setConfig({ ...config, issues: { enabled } })
									}
									status={issueStatus}
								/>
							</div>
						</div>

						{/* Embedding Models Section */}
						<div>
							<h3 className="text-text text-[14px] leading-[16.8px] font-sans mb-2">
								Embedding Models
							</h3>
							<div className="text-text-muted text-[12px] mb-3">
								Select at least one embedding model for indexing
							</div>
							<div className="space-y-2">
								{Object.entries(GITHUB_EMBEDDING_PROFILES).map(
									([id, profile]) => {
										const profileId = Number(id);
										const isSelected = selectedProfiles.includes(profileId);
										const isLastOne =
											selectedProfiles.length === 1 && isSelected;

										return (
											<label
												key={profileId}
												className="flex items-start gap-3 p-3 rounded-lg border border-border-muted hover:bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_5%,transparent)] transition-colors cursor-pointer"
											>
												<input
													type="checkbox"
													checked={isSelected}
													disabled={isPending || isLastOne}
													onChange={(e) => {
														if (e.target.checked) {
															setSelectedProfiles([
																...selectedProfiles,
																profileId,
															]);
														} else {
															setSelectedProfiles(
																selectedProfiles.filter(
																	(id) => id !== profileId,
																),
															);
														}
													}}
													className="mt-1 w-4 h-4 text-primary-900 bg-surface border-border rounded focus:ring-primary-900"
												/>
												<div className="flex-1">
													<div className="text-text text-[14px] font-medium">
														{profile.name}
													</div>
													<div className="text-text-muted text-[12px] mt-1">
														Provider: {profile.provider} • Dimensions{" "}
														{profile.dimensions}
													</div>
												</div>
											</label>
										);
									},
								)}
							</div>
						</div>
					</div>

					{error && <div className="mt-4 text-sm text-error-500">{error}</div>}
				</DialogBody>
				<DialogFooter>
					<div className="mt-6 flex justify-end gap-x-3">
						<Button
							type="button"
							variant="link"
							size="large"
							onClick={() => setOpen(false)}
							disabled={isPending}
							aria-label="Cancel"
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="primary"
							size="large"
							onClick={handleSave}
							disabled={isPending}
							aria-label="Save Changes"
						>
							{isPending ? "Processing..." : "Save Changes"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

type ContentTypeToggleProps = {
	icon: React.ElementType;
	label: string;
	description: string;
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
	disabled?: boolean;
	status?: typeof githubRepositoryContentStatus.$inferSelect;
};

function ContentTypeToggle({
	icon: Icon,
	label,
	description,
	enabled,
	onToggle,
	disabled,
	status,
}: ContentTypeToggleProps) {
	return (
		<div className="bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_5%,transparent)] rounded-lg p-4">
			<Toggle
				name={`${label.toLowerCase().replace(/\s+/g, "-")}-toggle`}
				checked={enabled}
				onCheckedChange={(checked) => onToggle(checked)}
				disabled={disabled}
			>
				<div className="flex-1 mr-3">
					<div className="flex items-center gap-2 mb-1">
						<Icon size={18} className="text-text-muted" />
						<span className="text-text font-medium">{label}</span>
					</div>
					<p className="text-xs text-text-muted">
						{description}
						{disabled && (
							<span className="text-text-muted/60 ml-1">
								(Required - cannot be disabled)
							</span>
						)}
					</p>
					{status?.status === "running" && (
						<p className="text-xs text-text-muted mt-1">Currently syncing...</p>
					)}
				</div>
			</Toggle>
		</div>
	);
}
