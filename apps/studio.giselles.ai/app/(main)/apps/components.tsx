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
			New App +
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
					return redirect(`/workspaces/${res.workspaceId}`);

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
							<p>Duplicate</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</form>

			<AlertDialogContent className="text-white-800">
				<AlertDialogHeader>
					<AlertDialogTitle className="font-hubot text-[20px] font-medium">
						Are you sure to duplicate this App?
					</AlertDialogTitle>
					{agentName && (
						<AlertDialogDescription className="text-white-800 font-hubot">
							{agentName}
						</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				<AlertDialogFooter className="mt-6">
					<AlertDialogCancel className="border border-black-400 bg-transparent hover:bg-white-800 hover:text-black-900 text-white-800 rounded-lg py-2 px-6 font-hubot text-[16px] transition-colors">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						className="bg-primary-900 hover:bg-transparent hover:text-primary-900 hover:border-primary-900 border border-transparent text-white-800 rounded-lg py-2 px-6 font-hubot text-[16px] transition-colors"
					>
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
							<p>Delete</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</form>

			<AlertDialogContent className="text-white-800">
				<AlertDialogHeader>
					<AlertDialogTitle className="font-hubot text-[20px] font-medium">
						Are you sure you want to delete this App?
					</AlertDialogTitle>
					{agentName && (
						<AlertDialogDescription className="text-white-800 font-hubot">
							This action cannot be undone. This will permanently delete the app
							"{agentName}".
						</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				<AlertDialogFooter className="mt-6">
					<AlertDialogCancel className="border border-black-400 bg-transparent hover:bg-white-800 hover:text-black-900 text-white-800 rounded-lg py-2 px-6 font-hubot text-[16px] transition-colors">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						className="bg-error-900 hover:bg-transparent hover:text-error-900 hover:border-error-900 border border-transparent text-white-800 rounded-lg py-2 px-6 font-hubot text-[16px] transition-colors"
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
