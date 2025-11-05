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
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { useToast } from "@giselles-ai/contexts/toast";
import { LoaderCircleIcon, TrashIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AgentId } from "@/services/agents";
import { Button } from "../../settings/components/button";
import { deleteAgent } from "../actions";

export function DeleteAgentButton({
	agentId,
	agentName,
}: {
	agentId: AgentId;
	agentName: string | null;
}) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const { addToast } = useToast();
	const router = useRouter();

	const handleConfirm = () => {
		startTransition(async () => {
			try {
				const res = await deleteAgent(agentId);
				if (res.result === "success") {
					router.refresh();
					return;
				}
				addToast({ message: res.message, type: "error" });
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to delete workspace";
				addToast({ message, type: "error" });
			} finally {
				setOpen(false);
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<button
								type="button"
								aria-label="Delete a workspace"
								className="grid size-6 place-items-center rounded-full text-text/60 transition-colors hover:text-red-500"
								disabled={isPending}
							>
								{isPending ? (
									<LoaderCircleIcon className="size-4 animate-spin" />
								) : (
									<TrashIcon className="size-4" />
								)}
							</button>
						</DialogTrigger>
					</TooltipTrigger>
					<TooltipContent>Delete Workspace</TooltipContent>
				</Tooltip>
			</TooltipProvider>
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
						<Button variant="link" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleConfirm}
							disabled={isPending}
						>
							{isPending ? "Processing..." : "Delete"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
