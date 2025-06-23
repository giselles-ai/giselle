"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AgentId } from "@/services/agents";
import { useToast } from "@giselles-ai/contexts/toast";
import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircleIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
			const res = await deleteAgent(agentId);
			setOpen(false);
			if (res.result === "success") {
				router.refresh();
			} else {
				addToast({ message: res.message, type: "error" });
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
								className="grid size-6 place-items-center rounded-full text-white/60 transition-colors hover:text-red-500"
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
					<TooltipContent>Delete App</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<GlassDialogContent variant="destructive">
				<GlassDialogHeader
					title="Delete App"
					description={`This action cannot be undone. This will permanently delete the app "${
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
