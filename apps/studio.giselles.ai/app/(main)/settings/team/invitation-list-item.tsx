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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeamRole } from "@/drizzle";
import { useToast } from "@/packages/contexts/toast";
import { Copy, Ellipsis, RefreshCw, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { resendInvitationAction, revokeInvitationAction } from "./actions";
import { LocalDateTime } from "./components/local-date-time";

export type InvitationListItemProps = {
	token: string;
	email: string;
	role: TeamRole;
	expiredAt: Date;
};

export function InvitationListItem({
	token,
	email,
	role,
	expiredAt,
}: InvitationListItemProps) {
	const { addToast } = useToast();
	const [error, setError] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);

	// server actions
	const [revokeState, revoke, revokePending] = useActionState(
		revokeInvitationAction,
		undefined,
	);
	const [resendState, resend, resendPending] = useActionState(
		resendInvitationAction,
		undefined,
	);

	// toasts & close behavior
	useEffect(() => {
		if (!revokeState || revokePending) {
			return;
		}
		if (revokeState.success) {
			addToast({
				title: "Success",
				message: "Invitation revoked!",
				type: "success",
			});
			setDialogOpen(false);
			setDropdownOpen(false);
		} else if (!revokeState.success) {
			// revokeState.success is false => error property exists
			const err = revokeState.error;
			addToast({ title: "Error", message: err, type: "error" });
			setError(err);
		}
	}, [revokePending, revokeState, addToast]);

	// react to resend result
	useEffect(() => {
		if (!resendState || resendPending) {
			return;
		}

		if (resendState.success) {
			addToast({
				title: "Success",
				message: "Invitation resent!",
				type: "success",
			});
			setDropdownOpen(false);
		} else if (!resendState.success) {
			const err = resendState.error;
			addToast({ title: "Error", message: err, type: "error" });
		}
	}, [resendPending, resendState, addToast]);

	const expired = expiredAt.getTime() < Date.now();

	const handleCopy = async () => {
		try {
			const baseUrl =
				process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
			const link = `${baseUrl}/join/${token}`;
			await navigator.clipboard.writeText(link);
			addToast({
				title: "Copied",
				message: "Invite link copied!",
				type: "info",
			});
			setDropdownOpen(false);
		} catch (e) {
			console.error("Failed to copy link:", e);
			addToast({
				title: "Error",
				message: "Failed to copy link",
				type: "error",
			});
		}
	};

	return (
		<div className="px-2">
			<div className="flex items-center justify-between gap-4 py-4 border-b-[0.5px] border-black-400 font-hubot">
				<div className="flex gap-x-4 items-center">
					<div className="flex-shrink-0 opacity-50">
						<div className="w-8 h-8 rounded-full border border-dashed border-white-400 flex items-center justify-center">
							{/* Empty circle with dashed border */}
						</div>
					</div>
					<div className="flex flex-col gap-y-1 font-medium text-[12px] leading-[12px]">
						<div className="text-blue-80 flex items-center">
							{email}
							<span className="ml-2 text-black-400">(Invitation pending)</span>
						</div>
						{expired && (
							<div className="text-error-900 text-[12px]">
								Expired on <LocalDateTime date={expiredAt} />
							</div>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<span className="capitalize text-white-400 font-medium text-[14px] leading-[16px] text-end font-hubot">
						{role}
					</span>
					<DropdownMenu
						modal={false}
						open={dropdownOpen}
						onOpenChange={setDropdownOpen}
					>
						<DropdownMenuTrigger className="cursor-pointer">
							<Ellipsis className="text-white-350" />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="px-0 py-2 border-[0.5px] border-error-900 rounded-[8px] min-w-[165px] bg-black-850 shadow-none"
						>
							<button
								type="button"
								onClick={handleCopy}
								className="flex items-center w-full px-4 py-3 font-medium text-[14px] leading-[16px] text-white-400 hover:bg-black-700"
								title="Copy invite link"
							>
								<Copy className="h-4 w-4 mr-2" /> Copy invite link
							</button>
							<form action={resend} className="contents">
								<input type="hidden" name="token" value={token} />
								<button
									type="submit"
									disabled={resendPending}
									className="flex items-center w-full px-4 py-3 font-medium text-[14px] leading-[16px] text-white-400 hover:bg-black-700"
									title="Resend invitation"
								>
									{resendPending ? (
										<>
											<RefreshCw className="h-4 w-4 animate-spin mr-2" />{" "}
											Processing...
										</>
									) : (
										<>
											<RefreshCw className="h-4 w-4 mr-2" /> Resend invitation
										</>
									)}
								</button>
							</form>
							<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
								<AlertDialogTrigger asChild>
									<button
										type="button"
										disabled={revokePending}
										className="flex items-center w-full px-4 py-3 font-medium text-[14px] leading-[16px] text-error-900 hover:bg-black-700"
										title="Revoke invitation"
									>
										{revokePending ? (
											<>
												<RefreshCw className="h-4 w-4 animate-spin mr-2" />{" "}
												Processing...
											</>
										) : (
											<>
												<Trash2 className="h-4 w-4 mr-2" /> Revoke invitation
											</>
										)}
									</button>
								</AlertDialogTrigger>
								<AlertDialogContent className="border-[0.5px] border-black-400 rounded-[8px] bg-black-850">
									<AlertDialogHeader>
										<AlertDialogTitle className="text-white-400 text-[20px] leading-[29px] font-geist">
											Revoke Invitation
										</AlertDialogTitle>
										<AlertDialogDescription className="text-black-400 text-[14px] leading-[20.4px]">
											This will permanently revoke this invitation and prevent
											the user from joining your team.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter className="mt-4">
										<AlertDialogCancel
											className="py-2 px-4 border-[0.5px] border-black-400 rounded-[8px] font-hubot"
											disabled={revokePending}
										>
											Cancel
										</AlertDialogCancel>
										<form action={revoke} className="contents">
											<input type="hidden" name="token" value={token} />
											<AlertDialogAction
												type="submit"
												disabled={revokePending}
												className="py-2 px-4 bg-error-900 rounded-[8px] text-white-400 font-hubot"
											>
												Revoke
											</AlertDialogAction>
										</form>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			{error && (
				<div className="text-error-900 text-[12px] mt-1 ml-12">{error}</div>
			)}
		</div>
	);
}
