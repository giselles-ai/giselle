"use client";

import { useToast } from "@giselles-ai/contexts/toast";
import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircleIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Dialog.Trigger asChild>
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
						</Dialog.Trigger>
					</TooltipTrigger>
					<TooltipContent>Delete Workspace</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<GlassDialogContent variant="destructive">
				<GlassDialogHeader
					title="Delete Workspace"
					description={`This action cannot be undone. This will permanently delete the workspace "${
						agentName || "Untitled"
					}".`}
					onClose={() => setOpen(false)}
					variant="destructive"
				/>
				<GlassDialogFooter
					onCancel={() => setOpen(false)}
					onConfirm={handleConfirm}
					confirmLabel="Delete"
					isPending={isPending}
					variant="destructive"
				/>
			</GlassDialogContent>
		</Dialog.Root>
	);
}
