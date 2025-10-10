"use client";

import { Select, type SelectOption } from "@giselle-internal/ui/select";
import { Toggle } from "@giselle-internal/ui/toggle";
import * as Dialog from "@radix-ui/react-dialog";
import { Code, GitPullRequest, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import type { GitHubRepositoryContentType } from "@/drizzle";
import {
	GlassDialogBody,
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "../components/glass-dialog-content";
import { GITHUB_EMBEDDING_PROFILES } from "./github-embedding-profiles";
import type { ActionResult, InstallationWithRepos } from "./types";

type RepositoryRegistrationDialogProps = {
	installationsWithRepos: InstallationWithRepos[];
	registerRepositoryIndexAction: (
		owner: string,
		repo: string,
		installationId: number,
		contentTypes: {
			contentType: GitHubRepositoryContentType;
			enabled: boolean;
		}[],
		embeddingProfileIds?: number[],
	) => Promise<ActionResult>;
};

export function RepositoryRegistrationDialog({
	installationsWithRepos,
	registerRepositoryIndexAction,
}: RepositoryRegistrationDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [ownerId, setOwnerId] = useState<string>("");
	const [repositoryId, setRepositoryId] = useState<string>("");
	const [error, setError] = useState("");
	const [isPending, startTransition] = useTransition();
	const [contentConfig, setContentConfig] = useState({
		code: { enabled: true },
		pullRequests: { enabled: false },
	});
	const [selectedProfiles, setSelectedProfiles] = useState<number[]>([1]); // Default to OpenAI Small

	const selectedInstallation = installationsWithRepos.find(
		(i) => String(i.installation.id) === ownerId,
	);
	const repositoryOptions = selectedInstallation?.repositories || [];

	// Convert installations to SelectOption format
	const ownerOptions: SelectOption[] = installationsWithRepos.map(
		({ installation }) => ({
			value: String(installation.id),
			label: installation.name,
		}),
	);

	// Convert repositories to SelectOption format
	const repoSelectOptions: SelectOption[] = repositoryOptions.map((repo) => ({
		value: String(repo.id),
		label: repo.name,
	}));

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!ownerId) {
			setError("Owner is required");
			return;
		}
		if (!repositoryId) {
			setError("Repository is required");
			return;
		}

		startTransition(async () => {
			const owner = installationsWithRepos.find(
				(i) => String(i.installation.id) === ownerId,
			)?.installation.name;
			if (!owner) {
				setError("Owner not found");
				return;
			}
			const repo = repositoryOptions.find(
				(r) => String(r.id) === repositoryId,
			)?.name;
			if (!repo) {
				setError("Repository not found");
				return;
			}
			const contentTypes: {
				contentType: GitHubRepositoryContentType;
				enabled: boolean;
			}[] = [
				{ contentType: "blob", enabled: contentConfig.code.enabled },
				{
					contentType: "pull_request",
					enabled: contentConfig.pullRequests.enabled,
				},
			];

			const result = await registerRepositoryIndexAction(
				owner,
				repo,
				Number(ownerId),
				contentTypes,
				selectedProfiles,
			);
			if (result.success) {
				setIsOpen(false);
				setOwnerId("");
				setRepositoryId("");
				setContentConfig({
					code: { enabled: true },
					pullRequests: { enabled: false },
				});
				setSelectedProfiles([1]); // Reset to default
			} else {
				setError(result.error);
			}
		});
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
			<Dialog.Trigger asChild>
				<GlassButton className="whitespace-nowrap">
					<span className="grid size-4 place-items-center rounded-full bg-primary-200 opacity-50">
						<Plus className="size-3 text-bg" />
					</span>
					Register Repository
				</GlassButton>
			</Dialog.Trigger>
			<GlassDialogContent
				onEscapeKeyDown={() => setIsOpen(false)}
				onPointerDownOutside={() => setIsOpen(false)}
			>
				<GlassDialogHeader
					title="Register GitHub Repository"
					description="Add a GitHub repository to your Vector Store to use it in GitHub Vector Store Nodes."
					onClose={() => setIsOpen(false)}
				/>
				<GlassDialogBody>
					<form
						id="register-repository-form"
						onSubmit={handleSubmit}
						className="space-y-4"
						noValidate
					>
						<div className="flex flex-col gap-y-2">
							<label
								htmlFor="owner"
								className="text-text text-[14px] leading-[16.8px] font-sans"
							>
								Owner / Organization
							</label>
							<div className="relative">
								<Select
									options={ownerOptions}
									placeholder="Select owner"
									value={ownerId}
									onValueChange={(value) => {
										setOwnerId(value);
										setRepositoryId("");
									}}
									disabled={isPending}
									triggerClassName="bg-surface text-text text-[14px] font-geist"
									id="owner"
								/>
							</div>
						</div>

						<div className="flex flex-col gap-y-2">
							<label
								htmlFor="repository"
								className="text-text text-[14px] leading-[16.8px] font-sans"
							>
								Repository Name
							</label>
							<div className="relative">
								<Select
									options={repoSelectOptions}
									placeholder={
										!ownerId
											? "Select owner first"
											: repositoryOptions.length === 0
												? "No repositories available"
												: "Select repository"
									}
									value={repositoryId}
									onValueChange={setRepositoryId}
									disabled={isPending || !ownerId}
									triggerClassName="bg-surface text-text text-[14px] font-geist"
									id="repository"
								/>
							</div>
						</div>

						{/* Sources to Ingest Section */}
						<div className="flex flex-col gap-y-2">
							<div className="text-text text-[14px] leading-[16.8px] font-sans">
								Sources to Ingest
							</div>

							<div className="grid grid-cols-2 gap-3">
								{/* Code Configuration */}
								<div className="bg-inverse/5 rounded-lg p-4">
									<Toggle
										name="code-toggle"
										checked={contentConfig.code.enabled}
										onCheckedChange={(enabled) =>
											setContentConfig({ ...contentConfig, code: { enabled } })
										}
										disabled={true}
									>
										<div className="flex-1 mr-3">
											<div className="flex items-center gap-2 mb-1">
												<Code size={18} className="text-text-muted" />
												<span className="text-text font-medium">Code</span>
											</div>
											<p className="text-xs text-text-muted">
												Ingest source code files from the repository
											</p>
											<p className="text-xs text-text-muted/60 mt-1">
												(Required - cannot be disabled)
											</p>
										</div>
									</Toggle>
								</div>

								{/* Pull Requests Configuration */}
								<div className="bg-inverse/5 rounded-lg p-4">
									<Toggle
										name="pull-requests-toggle"
										checked={contentConfig.pullRequests.enabled}
										onCheckedChange={(enabled) =>
											setContentConfig({
												...contentConfig,
												pullRequests: { enabled },
											})
										}
									>
										<div className="flex-1 mr-3">
											<div className="flex items-center gap-2 mb-1">
												<GitPullRequest size={18} className="text-text-muted" />
												<span className="text-text font-medium">
													Pull Requests
												</span>
											</div>
											<p className="text-xs text-text-muted">
												Ingest merged pull request content and discussions
											</p>
										</div>
									</Toggle>
								</div>
							</div>

							{/* Embedding Profiles Section */}
							<div className="mt-4">
								<div className="text-text text-[14px] leading-[16.8px] font-sans mb-2">
									Embedding Models
								</div>
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
													className="flex items-start gap-3 p-3 rounded-lg border border-border-muted hover:bg-inverse/5 transition-colors cursor-pointer"
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
														className="mt-1 w-4 h-4 text-[#1663F3] bg-surface border-border rounded focus:ring-[#1663F3]/20"
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

						{error && (
							<div className="mt-1 text-sm text-error-900">{error}</div>
						)}
					</form>
				</GlassDialogBody>
				<GlassDialogFooter
					onCancel={() => setIsOpen(false)}
					onConfirm={() => {
						const form = document.getElementById(
							"register-repository-form",
						) as HTMLFormElement | null;
						if (!form) return;
						if (typeof form.requestSubmit === "function") {
							form.requestSubmit();
						} else {
							form.submit();
						}
					}}
					confirmLabel="Register"
					isPending={isPending}
				/>
			</GlassDialogContent>
		</Dialog.Root>
	);
}
