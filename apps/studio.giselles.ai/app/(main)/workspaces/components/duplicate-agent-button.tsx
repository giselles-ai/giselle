"use client";

import { useToast } from "@giselles-ai/contexts/toast";
import * as Dialog from "@radix-ui/react-dialog";
import { CopyIcon, LoaderCircleIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { useState, useTransition } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AgentId } from "@/services/agents";
import {
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "../../settings/team/components/glass-dialog-content";
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
	const { addToast } = useToast();

	const handleConfirm = () => {
		startTransition(async () => {
			const res = await copyAgent(agentId);
			if (res.result === "success") {
				setOpen(false);
				redirect(`/workspaces/${res.workspaceId}`);
			} else {
				addToast({
					type: "error",
					message: res.message || "Failed to duplicate workspace.",
				});
			}
		});
	};

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Dialog.Trigger asChild>
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
						</Dialog.Trigger>
					</TooltipTrigger>
					<TooltipContent>Duplicate Workspace</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<GlassDialogContent>
				<GlassDialogHeader
					title={`Duplicate "${agentName || "Untitled"}"?`}
					description="This will create a new workspace with the same settings as the original."
					onClose={() => setOpen(false)}
				/>
				<GlassDialogFooter
					onCancel={() => setOpen(false)}
					onConfirm={handleConfirm}
					confirmLabel="Duplicate"
					isPending={isPending}
				/>
			</GlassDialogContent>
		</Dialog.Root>
	);
}
