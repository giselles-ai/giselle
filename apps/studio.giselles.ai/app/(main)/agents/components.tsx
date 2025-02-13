"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AgentId } from "@/services/agents";
import { Toast } from "@giselles-ai/components/toast";
import { useToast } from "@giselles-ai/contexts/toast";
import { CopyIcon, LoaderCircleIcon, TrashIcon } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { copyAgent, deleteAgent } from "./actions";

export function CreateAgentButton() {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" disabled={pending} data-loading={pending}>
			New Agent +
		</Button>
	);
}

export function Toasts() {
	const { toasts } = useToast();
	return (
		<>
			{toasts.map(({ id, ...props }) => (
				<Toast key={id} {...props} />
			))}
		</>
	);
}

export function DuplicateAgentButton({
	agentId,
	agentName,
}: { agentId: AgentId; agentName: string | null }) {
	const action = copyAgent.bind(null, agentId);
	const { addToast } = useToast();
	const [isPending, startTransition] = useTransition();
	const formRef = useRef<HTMLFormElement>(null);

	const handleConfirm = () => {
		formRef.current?.requestSubmit();
	};

	const formAction = async (formData: FormData) => {
		startTransition(async () => {
			const res = await action(formData);
			switch (res.result) {
				case "success":
					return redirect(`/p/${res.agentId}`);

				case "error":
					addToast({ message: res.message, type: "error" });
			}
		});
	};

	return (
		<AlertDialog>
			<form
				ref={formRef}
				action={formAction}
				className="absolute top-4 right-4"
			>
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<AlertDialogTrigger asChild>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="text-black-30 hover:text-black--30"
									disabled={isPending}
								>
									{isPending ? (
										<LoaderCircleIcon className="w-[16px] h-[16px] animate-spin" />
									) : (
										<CopyIcon className="w-[16px] h-[16px]" />
									)}
								</button>
							</TooltipTrigger>
						</AlertDialogTrigger>
						<TooltipContent side="top">
							<p>Duplicate Agent</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</form>

			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Are you sure to duplicate this agent?
					</AlertDialogTitle>
					{agentName && (
						<AlertDialogDescription>{agentName}</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="border-2 bg-background hover:bg-accent hover:text-accent-foreground">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm}>
						Duplicate
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function DeleteAgentButton({
	agentId,
	agentName,
}: {
	agentId: AgentId;
	agentName: string | null;
}) {
	const action = deleteAgent.bind(null, agentId);
	const { addToast } = useToast();
	const [isPending, startTransition] = useTransition();
	const formRef = useRef<HTMLFormElement>(null);
	const router = useRouter();
	const handleConfirm = () => {
		formRef.current?.requestSubmit();
	};

	const formAction = async (formData: FormData) => {
		startTransition(async () => {
			const res = await action(formData);
			switch (res.result) {
				case "success":
					router.refresh();
					break;
				case "error":
					addToast({ message: res.message, type: "error" });
					break;
			}
		});
	};

	return (
		<AlertDialog>
			<form
				ref={formRef}
				action={formAction}
				className="absolute top-4 right-12"
			>
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<AlertDialogTrigger asChild>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="text-black-30 hover:text-red-500"
									disabled={isPending}
								>
									{isPending ? (
										<LoaderCircleIcon className="w-[16px] h-[16px] animate-spin" />
									) : (
										<TrashIcon className="w-[16px] h-[16px]" />
									)}
								</button>
							</TooltipTrigger>
						</AlertDialogTrigger>
						<TooltipContent side="top">
							<p>Delete Agent</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</form>

			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Are you sure you want to delete this agent?
					</AlertDialogTitle>
					{agentName && (
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							agent "{agentName}".
						</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="border-2 bg-background hover:bg-accent hover:text-accent-foreground">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						className="bg-red-500 hover:bg-red-600"
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
