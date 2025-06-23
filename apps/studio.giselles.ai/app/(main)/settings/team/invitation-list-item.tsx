"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeamRole } from "@/drizzle";
import { useToast } from "@/packages/contexts/toast";
import * as Dialog from "@radix-ui/react-dialog";
import { Copy, Ellipsis, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { resendInvitationAction, revokeInvitationAction } from "./actions";
import {
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "./components/glass-dialog-content";
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
	const [isResendPending, startResendTransition] = useTransition();
	const [isRevokePending, startRevokeTransition] = useTransition();

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

	const handleResend = () => {
		startResendTransition(async () => {
			const formData = new FormData();
			formData.append("token", token);
			const res = await resendInvitationAction(undefined, formData);
			if (res.success) {
				addToast({
					title: "Success",
					message: "Invitation resent!",
					type: "success",
				});
				setDropdownOpen(false);
			} else {
				addToast({ title: "Error", message: res.error, type: "error" });
			}
		});
	};

	const handleConfirmRevoke = () => {
		startRevokeTransition(async () => {
			const formData = new FormData();
			formData.append("token", token);
			const res = await revokeInvitationAction(undefined, formData);
			if (res.success) {
				addToast({
					title: "Success",
					message: "Invitation revoked!",
					type: "success",
				});
				setDialogOpen(false);
				setDropdownOpen(false);
			} else {
				const err = res.error;
				addToast({ title: "Error", message: err, type: "error" });
				setError(err);
			}
		});
	};

	return (
		<div className="px-2 py-4 border-t-[0.5px] border-white/10 first:border-t-0 font-sans">
			<div className="flex items-center justify-between gap-2">
				<div className="flex gap-x-2 items-center">
					<div className="flex-shrink-0 opacity-50">
						<div className="w-9 h-9 rounded-full border border-dashed border-white-400 flex items-center justify-center">
							{/* Empty circle with dashed border */}
						</div>
					</div>
					<div className="flex flex-col gap-y-1 font-medium">
						<div className="text-white-900/50 text-[14px] leading-[20.4px] flex items-center">
							{email}
							<span className="ml-2 text-black-400 text-[12px] leading-[16px]">
								(Invitation pending)
							</span>
						</div>
						{expired && (
							<div className="text-error-900 text-[12px] leading-[16px]">
								Expired on <LocalDateTime date={expiredAt} />
							</div>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<span className="capitalize text-white-400 font-medium text-[14px] leading-[16px] text-end font-sans">
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
							className="p-1 border-[0.25px] border-white/10 rounded-[8px] min-w-[165px] bg-black-900 shadow-none"
						>
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();
									handleCopy();
								}}
								className="flex items-center px-4 py-3 font-medium text-[14px] leading-[16px] text-white-400 hover:bg-white/5 rounded-md focus:outline-none"
								title="Copy invite link"
							>
								<Copy className="h-4 w-4 mr-2" /> Copy invite link
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();
									handleResend();
								}}
								disabled={isResendPending}
								className="flex items-center px-4 py-3 font-medium text-[14px] leading-[16px] text-white-400 hover:bg-white/5 rounded-md"
								title="Resend invitation"
							>
								{isResendPending ? (
									<>
										<RefreshCw className="h-4 w-4 animate-spin mr-2" />{" "}
										Processing...
									</>
								) : (
									<>
										<RefreshCw className="h-4 w-4 mr-2" /> Resend invitation
									</>
								)}
							</DropdownMenuItem>
							<Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
								<Dialog.Trigger asChild>
									<DropdownMenuItem
										onSelect={(e) => e.preventDefault()}
										disabled={isRevokePending}
										className="flex items-center w-full px-4 py-3 font-medium text-[14px] leading-[16px] text-error-900 hover:bg-error-900/20 rounded-md"
										title="Revoke invitation"
									>
										{isRevokePending ? (
											<>
												<RefreshCw className="h-4 w-4 animate-spin mr-2" />{" "}
												Processing...
											</>
										) : (
											<>
												<Trash2 className="h-4 w-4 mr-2" /> Revoke invitation
											</>
										)}
									</DropdownMenuItem>
								</Dialog.Trigger>
								<GlassDialogContent variant="destructive">
									<GlassDialogHeader
										title="Revoke Invitation"
										description="This will permanently revoke this invitation and prevent the user from joining your team."
										variant="destructive"
										onClose={() => setDialogOpen(false)}
									/>
									<GlassDialogFooter
										variant="destructive"
										onCancel={() => setDialogOpen(false)}
										onConfirm={handleConfirmRevoke}
										confirmLabel="Revoke"
										isPending={isRevokePending}
									/>
								</GlassDialogContent>
							</Dialog.Root>
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
