"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlassButton } from "@/components/ui/glass-button";
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
			const result = await registerRepositoryIndexAction(
				owner,
				repo,
				Number(ownerId),
			);
			if (result.success) {
				setIsOpen(false);
				setOwnerId("");
				setRepositoryId("");
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
