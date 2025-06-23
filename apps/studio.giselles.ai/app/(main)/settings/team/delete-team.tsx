"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useState } from "react";
import { Alert, AlertDescription } from "../components/alert";
import { Button } from "../components/button";
import { deleteTeam } from "./actions";
import {
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "./components/glass-dialog-content";

export function DeleteTeam() {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [state, action, pending] = useActionState(deleteTeam, {
		error: "",
	});

	const handleCloseDialog = () => {
		setShowDeleteConfirm(false);
	};

	return (
		<Dialog.Root open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
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
				<Dialog.Trigger asChild>
					<Button variant="destructive" className="whitespace-nowrap">
						Delete Team
					</Button>
				</Dialog.Trigger>
			</div>
			<GlassDialogContent
				onEscapeKeyDown={handleCloseDialog}
				onPointerDownOutside={handleCloseDialog}
				variant="destructive"
			>
				<GlassDialogHeader
					title="Delete Team"
					description="This action cannot be undone. This will permanently delete the team and remove all members."
					onClose={handleCloseDialog}
					variant="destructive"
				/>
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
					<GlassDialogFooter
						onCancel={handleCloseDialog}
						confirmLabel={pending ? "Deleting..." : "Delete Team"}
						isPending={pending}
						variant="destructive"
						confirmButtonType="submit"
					/>
				</form>
			</GlassDialogContent>
		</Dialog.Root>
	);
}
