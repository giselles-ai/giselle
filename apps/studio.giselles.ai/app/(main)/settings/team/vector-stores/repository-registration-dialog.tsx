"use client";

import { EMBEDDING_PROFILES } from "@giselle-sdk/data-type";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, Code, GitPullRequest, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlassButton } from "@/components/ui/glass-button";
import type { GitHubRepositoryContentType } from "@/drizzle";
import {
	GlassDialogBody,
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "../components/glass-dialog-content";
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
					<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
						<Plus className="size-3 text-black-900" />
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
								className="text-white-400 text-[14px] leading-[16.8px] font-sans"
							>
								Owner / Organization
							</label>
							<div className="relative">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											type="button"
											className="w-full px-3 py-2 bg-black-300/20 rounded-[8px] text-white-400 text-[14px] font-geist placeholder:text-white/30 cursor-pointer text-left flex items-center justify-between"
											disabled={isPending}
										>
											<span
												className={
													selectedInstallation?.installation.name
														? ""
														: "text-white/30"
												}
											>
												{selectedInstallation?.installation.name ||
													"Select owner"}
											</span>
											<ChevronDown className="h-4 w-4 text-white/60" />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="start"
										className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-[8px] border-[0.25px] border-white/10 bg-black-850 p-1 shadow-none"
									>
										{installationsWithRepos.map(({ installation }) => (
											<button
												key={installation.id}
												type="button"
												onClick={() => {
													setOwnerId(String(installation.id));
													setRepositoryId("");
												}}
												className="flex w-full items-center rounded-md px-3 py-2 text-left font-sans text-[14px] leading-[16px] text-white-400 hover:bg-white/5"
											>
												<span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
													{ownerId === String(installation.id) && (
														<Check className="h-4 w-4" />
													)}
												</span>
												{installation.name}
											</button>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						<div className="flex flex-col gap-y-2">
							<label
								htmlFor="repository"
								className="text-white-400 text-[14px] leading-[16.8px] font-sans"
							>
								Repository Name
							</label>
							<div className="relative">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											type="button"
											className="w-full px-3 py-2 bg-black-300/20 rounded-[8px] text-white-400 text-[14px] font-geist cursor-pointer disabled:opacity-50 text-left flex items-center justify-between"
											disabled={isPending || !ownerId}
										>
											<span
												className={
													repositoryOptions.find(
														(r) => String(r.id) === repositoryId,
													)?.name
														? ""
														: "text-white/30"
												}
											>
												{repositoryOptions.find(
													(r) => String(r.id) === repositoryId,
												)?.name || "Select repository"}
											</span>
											<ChevronDown className="h-4 w-4 text-white/60" />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="start"
										className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-[8px] border-[0.25px] border-white/10 bg-black-850 p-1 shadow-none"
									>
										{!ownerId ? (
											<div className="px-3 py-2 text-white/60 text-sm">
												Select owner first
											</div>
										) : repositoryOptions.length === 0 ? (
											<div className="px-3 py-2 text-white/60 text-sm">
												No repositories available
											</div>
										) : (
											repositoryOptions.map((repo) => (
												<button
													key={repo.id}
													type="button"
													onClick={() => setRepositoryId(String(repo.id))}
													className="flex w-full items-center rounded-md px-3 py-2 text-left font-sans text-[14px] leading-[16px] text-white-400 hover:bg-white/5"
												>
													<span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
														{repositoryId === String(repo.id) && (
															<Check className="h-4 w-4" />
														)}
													</span>
													{repo.name}
												</button>
											))
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						{/* Sources to Ingest Section */}
						<div className="flex flex-col gap-y-2">
							<div className="text-white-400 text-[14px] leading-[16.8px] font-sans">
								Sources to Ingest
							</div>

							<div className="space-y-3">
								{/* Code Configuration */}
								<ContentTypeToggle
									icon={Code}
									label="Code"
									description="Ingest source code files from the repository"
									enabled={contentConfig.code.enabled}
									onToggle={(enabled) =>
										setContentConfig({ ...contentConfig, code: { enabled } })
									}
									disabled={true} // Code is mandatory
								/>

								{/* Pull Requests Configuration */}
								<ContentTypeToggle
									icon={GitPullRequest}
									label="Pull Requests"
									description="Ingest merged pull request content and discussions"
									enabled={contentConfig.pullRequests.enabled}
									onToggle={(enabled) =>
										setContentConfig({
											...contentConfig,
											pullRequests: { enabled },
										})
									}
								/>
							</div>

							{/* Embedding Profiles Section */}
							<div className="mt-4">
								<div className="text-white-400 text-[14px] leading-[16.8px] font-sans mb-2">
									Embedding Models
								</div>
								<div className="text-white-400/60 text-[12px] mb-3">
									Select at least one embedding model for indexing
								</div>
								<div className="space-y-2">
									{Object.entries(EMBEDDING_PROFILES).map(([id, profile]) => {
										const profileId = Number(id);
										const isSelected = selectedProfiles.includes(profileId);
										const isLastOne =
											selectedProfiles.length === 1 && isSelected;

										return (
											<label
												key={profileId}
												className="flex items-start gap-3 p-3 rounded-lg bg-black-300/10 hover:bg-black-300/20 transition-colors cursor-pointer"
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
														Provider: {profile.provider} • Dimensions:{" "}
														{profile.dimensions}
													</div>
												</div>
											</label>
										);
									})}
								</div>
							</div>
						</div>

						{error && (
							<div className="mt-1 text-sm text-error-500">{error}</div>
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

type ContentTypeToggleProps = {
	icon: React.ElementType;
	label: string;
	description: string;
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
	disabled?: boolean;
};

function ContentTypeToggle({
	icon: Icon,
	label,
	description,
	enabled,
	onToggle,
	disabled,
}: ContentTypeToggleProps) {
	return (
		<div className="bg-black-700/50 rounded-lg p-4">
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<Icon size={18} className="text-gray-400" />
					<span className="text-white font-medium">{label}</span>
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
			<p className="text-sm text-gray-400">{description}</p>
			{disabled && (
				<p className="text-xs text-gray-500 mt-1">
					(Required - cannot be disabled)
				</p>
			)}
		</div>
	);
}
