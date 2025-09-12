"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Code, GitPullRequest } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type {
	GitHubRepositoryContentType,
	githubRepositoryContentStatus,
} from "@/drizzle";
import type { RepositoryWithStatuses } from "@/lib/vector-stores/github";
import type { GitHubRepositoryIndexId } from "@/packages/types";
import {
	GlassDialogBody,
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "../components/glass-dialog-content";
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

	const [config, setConfig] = useState({
		code: { enabled: blobStatus?.enabled ?? true },
		pullRequests: { enabled: pullRequestStatus?.enabled ?? false },
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
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<GlassDialogContent
				onEscapeKeyDown={() => setOpen(false)}
				onPointerDownOutside={() => setOpen(false)}
			>
				<GlassDialogHeader
					title="Configure Vector Stores"
					description="Configure sources and embedding models for this repository"
					onClose={() => setOpen(false)}
				/>
				<GlassDialogBody>
					<div className="space-y-6">
						{/* Sources Section */}
						<div>
							<h3 className="text-white-400 text-[16px] font-medium">
								Sources
							</h3>
							<div className="text-white-400/60 text-[12px] mb-4">
								Select which content types to ingest for {repositoryIndex.owner}
								/{repositoryIndex.repo}
							</div>
							<div className="space-y-2">
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
							</div>
						</div>

						{/* Embedding Models Section */}
						<div>
							<h3 className="text-white-400 text-[16px] font-medium">
								Embedding Models
							</h3>
							<div className="text-white-400/60 text-[12px] mb-3">
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
												className="flex items-start gap-3 p-2 rounded-lg bg-black-700/50 hover:bg-black-700/70 transition-colors cursor-pointer"
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
													className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
												/>
												<div className="flex-1">
													<div className="text-white-400 text-[14px] font-medium">
														{profile.name}
													</div>
													<div className="text-white-400/60 text-[12px] mt-1">
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
				</GlassDialogBody>
				<GlassDialogFooter
					onCancel={() => setOpen(false)}
					onConfirm={handleSave}
					confirmLabel="Save Changes"
					isPending={isPending}
				/>
			</GlassDialogContent>
		</Dialog.Root>
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
		<div className="bg-black-700/50 rounded-lg p-2">
			<div className="flex items-center justify-between mb-1">
				<div className="flex items-center gap-2">
					<Icon size={18} className="text-gray-400" />
					<span className="text-white font-medium text-[14px]">{label}</span>
				</div>
				<label className="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						checked={enabled}
						onChange={(e) => onToggle(e.target.checked)}
						disabled={disabled}
						className="sr-only"
					/>
					<div
						className={`w-11 h-6 rounded-full transition-colors ${
							enabled ? "bg-blue-600" : "bg-gray-600"
						} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
					>
						<div
							className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
								enabled ? "translate-x-6" : "translate-x-1"
							}`}
						/>
					</div>
				</label>
			</div>
			<p className="text-[12px] text-gray-400">{description}</p>
			{disabled && (
				<p className="text-xs text-gray-500 mt-1">
					(Required - cannot be disabled)
				</p>
			)}
			{status && status.status === "running" && (
				<p className="text-xs text-blue-400 mt-2">Currently syncing...</p>
			)}
		</div>
	);
}
