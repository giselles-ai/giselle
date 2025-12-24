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
import { useToasts } from "@giselle-internal/ui/toast";
import { CopyIcon, LoaderCircleIcon, X } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AgentId } from "@/services/agents";
import { Button } from "../../settings/components/button";
import { copyAgent } from "../actions";

export function DuplicateAgentButton({
	agentId,
	agentName,
}: {
	agentId: AgentId;
	agentName: string | null;
}) {
	const [isPending, startTransition] = useTransition();
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const { toast } = useToasts();

	const handleConfirm = () => {
		startTransition(async () => {
			const res = await copyAgent(agentId);
			if (res.result === "success") {
				setOpen(false);
				redirect(`/workspaces/${res.workspaceId}`);
			} else {
				toast(res.message || "Failed to duplicate workspace.", {
					type: "error",
					preserve: false,
				});
			}
		});
	};

	if (!mounted) return null;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<button
								type="button"
								aria-label="Duplicate a workspace"
								className="grid size-6 place-items-center rounded-full text-text/60 transition-colors hover:text-inverse"
								disabled={isPending}
							>
								{isPending ? (
									<LoaderCircleIcon className="size-4 animate-spin" />
								) : (
									<CopyIcon className="size-4" />
								)}
							</button>
						</DialogTrigger>
					</TooltipTrigger>
					<TooltipContent>Duplicate Workspace</TooltipContent>
				</Tooltip>
			</TooltipProvider>
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
						This will create a new workspace with the same settings as the
						original.
					</DialogDescription>
				</DialogHeader>
				<DialogBody />
				<DialogFooter>
					<div className="mt-6 flex justify-end gap-x-3">
						<Button variant="link" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleConfirm}
							disabled={isPending}
						>
							{isPending ? "Processing..." : "Duplicate"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
