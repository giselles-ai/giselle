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
import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { Alert, AlertDescription } from "../components/alert";
import { Button } from "../components/button";
import { deleteTeam } from "./actions";

export function DeleteTeam() {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [state, action, pending] = useActionState(deleteTeam, {
		error: "",
	});

	const handleCloseDialog = () => {
		setShowDeleteConfirm(false);
	};

	return (
		<Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
			<div className="flex justify-between items-center w-full border-[0.5px] border-error-900 relative rounded-[12px] overflow-hidden bg-white/[0.02] backdrop-blur-[8px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none p-6">
				<div className="flex flex-col gap-y-4">
					<h2 className="text-error-900 font-medium text-[16px] leading-[27.2px] tracking-normal font-sans">
						Delete Team
					</h2>
					<p className="text-red-900/50 font-medium text-[12px] leading-[20.4px] tracking-normal font-geist">
						Permanently remove your Team Account and all of its contents from
						the Giselle platform. This action is not reversible, so please
						continue with caution.
					</p>
				</div>
				<DialogTrigger asChild>
					<Button variant="destructive" className="whitespace-nowrap">
						Delete Team
					</Button>
				</DialogTrigger>
			</div>
			<DialogContent
				variant="destructive"
				onEscapeKeyDown={handleCloseDialog}
				onPointerDownOutside={handleCloseDialog}
			>
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="font-sans text-[20px] font-medium tracking-tight text-error-900">
							Delete Team
						</DialogTitle>
						<DialogClose className="rounded-sm text-inverse opacity-70 hover:opacity-100 focus:outline-none">
							<X className="h-5 w-5" />
							<span className="sr-only">Close</span>
						</DialogClose>
					</div>
					<DialogDescription className="font-geist mt-2 text-[14px] text-error-900/50">
						This action cannot be undone. This will permanently delete the team
						and remove all members.
					</DialogDescription>
				</DialogHeader>
				{state.error !== "" && (
					<Alert
						variant="destructive"
						className="mt-2 border-error-900/20 bg-error-900/5"
					>
						<AlertDescription className="font-geist text-[12px] font-medium leading-[20.4px] tracking-normal text-red-900/50">
							{state.error}
						</AlertDescription>
					</Alert>
				)}
				<form id="delete-team-form" action={action} className="mt-4 space-y-0">
					<DialogBody />
					<DialogFooter>
						<div className="mt-6 flex justify-end gap-x-3">
							<Button
								variant="link"
								type="button"
								onClick={handleCloseDialog}
								disabled={pending}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								type="submit"
								disabled={pending}
							>
								{pending ? "Deleting..." : "Delete Team"}
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
