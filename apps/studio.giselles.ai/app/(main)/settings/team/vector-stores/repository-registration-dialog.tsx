"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState, useTransition } from "react";
import { Button } from "../../components/button";

type Installation = {
	id: number;
	name: string;
};

type Repository = {
	id: number;
	owner: string;
	name: string;
};

export type InstallationWithRepos = {
	installation: Installation;
	repositories: Repository[];
};

type RepositoryRegistrationDialogProps = {
	installationsWithRepos: InstallationWithRepos[];
	registerRepositoryIndexAction: (
		owner: string,
		repo: string,
		installationId: number,
	) => Promise<void>;
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

	const handleSubmit = async (e: React.FormEvent) => {
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
			try {
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
				await registerRepositoryIndexAction(owner, repo, Number(ownerId));
				setIsOpen(false);
				setOwnerId("");
				setRepositoryId("");
			} catch (error) {
				setError("An error occurred");
				console.error(error);
			}
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="default">Register Repository</Button>
			</DialogTrigger>
			<DialogContent
				className="gap-y-6 px-[57px] py-[40px] max-w-[380px] w-full bg-black-900 border-none rounded-[16px] bg-linear-to-br/hsl from-black-600 to-black-250 sm:rounded-[16px]"
				style={{
					animation: "fadeIn 0.2s ease-out",
					transformOrigin: "center",
				}}
			>
				<style jsx global>{`
					@keyframes fadeIn {
						from {
							opacity: 0;
							transform: scale(0.95);
						}
						to {
							opacity: 1;
							transform: scale(1);
						}
					}
				`}</style>
				<div
					aria-hidden="true"
					className="absolute inset-0 rounded-[16px] border-[0.5px] border-transparent bg-black-900 bg-clip-padding"
				/>
				<DialogHeader className="relative z-10">
					<DialogTitle className="text-white-800 font-semibold text-[20px] leading-[28px] font-hubot text-center">
						Register GitHub Repository
					</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={handleSubmit}
					className="flex flex-col gap-y-4 relative z-10"
				>
					<div className="flex flex-col gap-y-2">
						<label
							htmlFor="owner"
							className="text-white-400 text-[14px] leading-[16.8px] font-hubot"
						>
							Owner
						</label>
						<Select
							value={ownerId}
							onValueChange={(val) => {
								setOwnerId(val);
								setRepositoryId("");
							}}
							disabled={isPending}
						>
							<SelectTrigger
								id="owner"
								className="py-2 rounded-[8px] w-full bg-white-30/30 text-black-800 font-medium text-[12px] leading-[20.4px] font-geist shadow-none focus:text-white border border-white-400"
							>
								<SelectValue placeholder="Select owner" />
							</SelectTrigger>
							<SelectContent>
								{installationsWithRepos.length === 0 ? (
									<div className="px-3 py-2 text-muted-foreground text-sm">
										No owners available
									</div>
								) : (
									installationsWithRepos.map(({ installation }) => (
										<SelectItem
											key={installation.id}
											value={String(installation.id)}
										>
											{installation.name}
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-y-2">
						<label
							htmlFor="repo"
							className="text-white-400 text-[14px] leading-[16.8px] font-hubot"
						>
							Repository Name
						</label>
						<Select
							value={repositoryId}
							onValueChange={setRepositoryId}
							disabled={isPending || !ownerId}
						>
							<SelectTrigger
								id="repo"
								className="py-2 rounded-[8px] w-full bg-white-30/30 text-black-800 font-medium text-[12px] leading-[20.4px] font-geist shadow-none focus:text-white border border-white-400"
							>
								<SelectValue placeholder="Select repository" />
							</SelectTrigger>
							<SelectContent>
								{!ownerId ? (
									<div className="px-3 py-2 text-muted-foreground text-sm">
										Select owner first
									</div>
								) : repositoryOptions.length === 0 ? (
									<div className="px-3 py-2 text-muted-foreground text-sm">
										No repositories available
									</div>
								) : (
									repositoryOptions.map((repo) => (
										<SelectItem key={repo.id} value={String(repo.id)}>
											{repo.name}
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
					</div>
					{error && (
						<p className="text-[12px] leading-[20.4px] text-error-900 font-geist">
							{error}
						</p>
					)}
					<div className="flex justify-end space-x-4 mt-2">
						<Button
							type="button"
							onClick={() => setIsOpen(false)}
							disabled={isPending}
							className="w-full h-[38px] bg-transparent border-black-400 text-black-400 text-[16px] leading-[19.2px] tracking-[-0.04em] hover:bg-transparent hover:text-black-400 "
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isPending}
							className="w-full h-[38px] text-[16px] leading-[19.2px] tracking-[-0.04em]"
						>
							Register
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
