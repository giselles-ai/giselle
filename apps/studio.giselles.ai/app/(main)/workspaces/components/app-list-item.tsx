"use client";

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
import { GlassSurfaceLayers } from "@giselle-internal/ui/glass-surface";
import { useToast } from "@giselles-ai/contexts/toast";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import clsx from "clsx/lite";
import { Ellipsis, File, X, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import type { AgentId } from "@/services/agents";
import { GitHubIcon } from "../../../../../../internal-packages/workflow-designer-ui/src/icons";
import { Tooltip } from "../../../../../../internal-packages/workflow-designer-ui/src/ui/tooltip";
import { Button } from "../../settings/components/button";
import { copyAgent, deleteAgent } from "../actions";
import { formatExecutionCount } from "./format-execution-count";

interface AppListItemProps {
	href: string;
	title: string;
	subtitle?: string;
	integrationIcons?: React.ReactNode;
	creator?: string | null;
	githubRepositories?: string[];
	documentVectorStoreFiles?: string[];
	executionCount?: number;
	agentId?: string;
	agentName?: string | null;
	className?: string;
}

export function AppListItem({
	href,
	title,
	subtitle,
	integrationIcons,
	creator,
	githubRepositories,
	documentVectorStoreFiles,
	executionCount,
	agentId,
	agentName,
	className,
}: AppListItemProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [isDuplicatePending, startDuplicateTransition] = useTransition();
	const [isDeletePending, startDeleteTransition] = useTransition();
	const { addToast } = useToast();
	const router = useRouter();

	const handleDuplicate = () => {
		setMenuOpen(false);
		setDuplicateDialogOpen(true);
	};

	const handleDelete = () => {
		setMenuOpen(false);
		setDeleteDialogOpen(true);
	};

	const handleDuplicateConfirm = useCallback(() => {
		if (!agentId) return;
		startDuplicateTransition(async () => {
			const res = await copyAgent(agentId as AgentId);
			if (res.result === "success") {
				setDuplicateDialogOpen(false);
				router.push(`/workspaces/${res.workspaceId}`);
			} else {
				addToast({
					type: "error",
					message: res.message || "Failed to duplicate workspace.",
				});
			}
		});
	}, [agentId, addToast, router]);

	const handleDeleteConfirm = useCallback(() => {
		if (!agentId) return;
		startDeleteTransition(async () => {
			try {
				const res = await deleteAgent(agentId);
				if (res.result === "success") {
					router.refresh();
					setDeleteDialogOpen(false);
					return;
				}
				addToast({ message: res.message, type: "error" });
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to delete workspace";
				addToast({ message, type: "error" });
			} finally {
				setDeleteDialogOpen(false);
			}
		});
	}, [agentId, router, addToast]);

	return (
		<div
			className={clsx(
				"group grid grid-cols-[2fr_1fr_1.5fr_1fr_auto] items-center gap-4 px-2 py-3 first:border-t-0 border-t-[0.5px] border-border-muted",
				className,
			)}
		>
			<Link href={href} className="contents">
				<div className="flex flex-col gap-y-1 min-w-0 max-w-[200px]">
					<p className="text-[14px] font-sans text-inverse truncate">{title}</p>
					{subtitle ? (
						<p className="text-[12px] font-geist text-text/60">{subtitle}</p>
					) : null}
				</div>
				<div className="flex items-center gap-1.5 flex-shrink-0">
					{integrationIcons}
				</div>
				<div className="flex flex-col gap-1 min-w-0">
					{githubRepositories && githubRepositories.length > 0 && (
						<div className="flex items-center gap-2">
							<GitHubIcon className="w-3 h-3 text-text/60 flex-shrink-0" />
							<div className="flex flex-col gap-1 min-w-0 flex-1">
								{githubRepositories.slice(0, 1).map((repo) => (
									<div key={repo} className="flex items-center gap-1">
										<div className="font-geist text-[11px] text-text/60 truncate">
											{repo}
										</div>
										{githubRepositories.length > 1 && (
											<Tooltip
												text={
													<div className="flex flex-col gap-1 bg-bg-900/30 rounded px-2 py-0.5 border border-white/20">
														{githubRepositories.slice(1).map((hiddenRepo) => (
															<span key={hiddenRepo}>{hiddenRepo}</span>
														))}
													</div>
												}
												variant="dark"
												side="top"
											>
												<button
													type="button"
													className="relative z-50 font-geist text-[11px] text-text/60 flex-shrink-0 px-1.5 py-0.5 rounded-lg border border-border-muted"
													onClick={(e) => {
														e.stopPropagation();
														e.preventDefault();
													}}
												>
													+{githubRepositories.length - 1}
												</button>
											</Tooltip>
										)}
									</div>
								))}
							</div>
						</div>
					)}
					{documentVectorStoreFiles && documentVectorStoreFiles.length > 0 && (
						<div className="flex items-center gap-2">
							<File className="w-3 h-3 text-text/60 flex-shrink-0" />
							<div className="flex flex-col gap-1 min-w-0 flex-1">
								{documentVectorStoreFiles.slice(0, 1).map((fileName) => (
									<div key={fileName} className="flex items-center gap-1">
										<div className="font-geist text-[11px] text-text/60 truncate">
											{fileName}
										</div>
										{documentVectorStoreFiles.length > 1 && (
											<Tooltip
												text={
													<div className="flex flex-col gap-1 bg-bg-900/30 rounded px-2 py-0.5 border border-white/20">
														{documentVectorStoreFiles
															.slice(1)
															.map((hiddenFile) => (
																<span key={hiddenFile}>{hiddenFile}</span>
															))}
													</div>
												}
												variant="dark"
												side="top"
											>
												<button
													type="button"
													className="relative z-50 font-geist text-[11px] text-text/60 flex-shrink-0 px-1.5 py-0.5 rounded-lg border border-border-muted"
													onClick={(e) => {
														e.stopPropagation();
														e.preventDefault();
													}}
												>
													+{documentVectorStoreFiles.length - 1}
												</button>
											</Tooltip>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
				<div className="min-w-0">
					{creator ? (
						<p className="text-[12px] font-geist text-text/60 truncate">
							{creator}
						</p>
					) : null}
				</div>
			</Link>
			<div className="flex items-center gap-3 justify-end min-w-0">
				<div className="flex items-center gap-1">
					<Zap className="w-3 h-3 text-text/60 flex-shrink-0" />
					<span className="text-[12px] font-geist text-text/60">
						{formatExecutionCount(executionCount)}
					</span>
				</div>
				{agentId && (
					<>
						<DropdownMenuPrimitive.Root
							open={menuOpen}
							onOpenChange={setMenuOpen}
						>
							<DropdownMenuPrimitive.Trigger asChild>
								<button
									type="button"
									className="text-text/60 hover:text-text/80 transition-colors flex-shrink-0"
									aria-label="Actions"
								>
									<Ellipsis className="w-4 h-4" />
								</button>
							</DropdownMenuPrimitive.Trigger>
							<DropdownMenuPrimitive.Portal>
								<DropdownMenuPrimitive.Content
									sideOffset={4}
									className={clsx(
										"relative z-50 min-w-[165px] overflow-hidden rounded-[12px] p-1 text-text shadow-md",
									)}
								>
									<GlassSurfaceLayers tone="default" borderStyle="solid" />
									<DropdownMenuPrimitive.Item
										onSelect={handleDuplicate}
										className={clsx(
											"rounded-md px-3 py-2 text-[14px] font-medium outline-none",
											"text-text hover:bg-surface/5 cursor-pointer",
										)}
									>
										<span className="inline-flex items-center gap-2">
											Duplicate
										</span>
									</DropdownMenuPrimitive.Item>
									<DropdownMenuPrimitive.Item
										onSelect={handleDelete}
										className={clsx(
											"rounded-md px-3 py-2 text-[14px] font-medium outline-none",
											"text-error-900 hover:bg-error-900/20 cursor-pointer",
										)}
									>
										<span className="inline-flex items-center gap-2">
											Delete
										</span>
									</DropdownMenuPrimitive.Item>
								</DropdownMenuPrimitive.Content>
							</DropdownMenuPrimitive.Portal>
						</DropdownMenuPrimitive.Root>

						{/* Duplicate Dialog */}
						<Dialog
							open={duplicateDialogOpen}
							onOpenChange={setDuplicateDialogOpen}
						>
							<DialogContent variant="glass">
								<DialogHeader>
									<div className="flex items-center justify-between">
										<DialogTitle className="font-sans text-[20px] font-medium tracking-tight text-inverse">
											{`Duplicate "${agentName || "Untitled"}"?`}
										</DialogTitle>
										<DialogClose className="rounded-sm text-inverse opacity-70 hover:opacity-100 focus:outline-none">
											<X className="h-5 w-5" />
											<span className="sr-only">Close</span>
										</DialogClose>
									</div>
									<DialogDescription className="font-geist mt-2 text-[14px] text-text-muted">
										This will create a new workspace with the same settings as
										the original.
									</DialogDescription>
								</DialogHeader>
								<DialogBody />
								<DialogFooter>
									<div className="mt-6 flex justify-end gap-x-3">
										<Button
											variant="link"
											onClick={() => setDuplicateDialogOpen(false)}
										>
											Cancel
										</Button>
										<Button
											variant="primary"
											onClick={handleDuplicateConfirm}
											disabled={isDuplicatePending}
										>
											{isDuplicatePending ? "Processing..." : "Duplicate"}
										</Button>
									</div>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						{/* Delete Dialog */}
						<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
							<DialogContent variant="destructive">
								<DialogHeader>
									<div className="flex items-center justify-between">
										<DialogTitle className="font-sans text-[20px] font-medium tracking-tight text-error-900">
											Delete Workspace
										</DialogTitle>
										<DialogClose className="rounded-sm text-inverse opacity-70 hover:opacity-100 focus:outline-none">
											<X className="h-5 w-5" />
											<span className="sr-only">Close</span>
										</DialogClose>
									</div>
									<DialogDescription className="font-geist mt-2 text-[14px] text-error-900/50">
										{`This action cannot be undone. This will permanently delete the workspace "${
											agentName || "Untitled"
										}".`}
									</DialogDescription>
								</DialogHeader>
								<DialogBody />
								<DialogFooter>
									<div className="mt-6 flex justify-end gap-x-3">
										<Button
											variant="link"
											onClick={() => setDeleteDialogOpen(false)}
										>
											Cancel
										</Button>
										<Button
											variant="destructive"
											onClick={handleDeleteConfirm}
											disabled={isDeletePending}
										>
											{isDeletePending ? "Processing..." : "Delete"}
										</Button>
									</div>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</>
				)}
			</div>
		</div>
	);
}
