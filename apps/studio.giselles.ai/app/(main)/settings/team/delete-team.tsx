"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useActionState, useState } from "react";
import { Alert, AlertDescription } from "../components/alert";
import { Button } from "../components/button";
import { deleteTeam } from "./actions";

export function DeleteTeam() {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [state, action, pending] = useActionState(deleteTeam, {
		error: "",
	});

	const handleOpenChange = (open: boolean) => {
		setShowDeleteConfirm(open);
	};

	return (
		<div className="flex justify-between items-center gap-x-[10px] bg-transparent rounded-[8px] border-[0.5px] border-error-900 px-[24px] pt-[16px] pb-[24px] w-full">
			<div className="flex flex-col gap-y-4 max-w-[557px]">
				<h2 className="text-error-900 font-medium text-[16px] leading-[27.2px] tracking-normal font-hubot">
					Delete Team
				</h2>
				<p className="text-red-900/50 font-medium text-[12px] leading-[20.4px] tracking-normal font-geist">
					Permanently remove your Team Account and all of its contents from the
					Giselle platform. This action is not reversible, so please continue
					with caution.
				</p>
			</div>
			<Dialog open={showDeleteConfirm} onOpenChange={handleOpenChange}>
				<DialogTrigger asChild>
					<Button variant="destructive" className="whitespace-nowrap">
						Delete Team
					</Button>
				</DialogTrigger>
				<DialogContent
					className="px-8 py-6 border-[0.5px] border-error-900 rounded-[16px] bg-black-850 animate-fadeIn fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
					style={{
						animation: "0.2s ease-out 0s 1 normal none running fadeIn",
					}}
				>
					<div
						aria-hidden="true"
						className="absolute inset-0 rounded-[16px] border-[0.5px] border-transparent bg-black-850 bg-clip-padding"
					/>
					<DialogHeader className="relative z-10">
						<DialogTitle className="text-error-900 font-bold text-[20px] leading-[28px] font-hubot text-center">
							Delete Team
						</DialogTitle>
					</DialogHeader>
					<p className="text-error-900 font-medium text-[14px] leading-[24px] relative z-10 text-center my-4">
						This action cannot be undone. This will permanently delete the team
						and remove all members.
					</p>
					{state.error !== "" && (
						<Alert
							variant="destructive"
							className="mt-2 bg-error-900/5 border-error-900/20 relative z-10"
						>
							<AlertDescription className="text-red-900/50 font-medium text-[12px] leading-[20.4px] tracking-normal font-geist">
								{state.error}
							</AlertDescription>
						</Alert>
					)}
					<form
						action={action}
						className="flex justify-end space-x-4 relative z-10"
					>
						<Button
							type="button"
							onClick={() => setShowDeleteConfirm(false)}
							className="border-black-400 w-full h-[38px] bg-transparent text-black-400 font-semibold text-[16px] leading-[19.2px] tracking-[-0.04em] hover:bg-transparent hover:text-black-400"
							disabled={pending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="destructive"
							disabled={pending}
							className="w-full h-[38px] font-semibold text-[16px] leading-[19.2px] tracking-[-0.04em]"
						>
							{pending ? "Deleting..." : "Delete Team"}
						</Button>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
