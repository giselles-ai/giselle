"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeamRole } from "@/drizzle";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import {
	Check,
	ChevronDown,
	Copy,
	Ellipsis,
	Plus,
	RefreshCw,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { email as emailValidator, parse, pipe, string } from "valibot";
import { Button } from "../components/button";
import { type SendInvitationsResult, sendInvitationsAction } from "./actions";
import {
	GlassDialogBody,
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "./components/glass-dialog-content";

type InviteMemberDialogProps = {
	memberEmails: string[];
	invitationEmails: string[];
};

export function InviteMemberDialog({
	memberEmails,
	invitationEmails,
}: InviteMemberDialogProps) {
	const [open, setOpen] = useState(false);
	const [emailInput, setEmailInput] = useState("");
	const [emailList, setEmailList] = useState<string[]>([]);
	const [role, setRole] = useState<TeamRole>("member");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [dialogKey, setDialogKey] = useState(Date.now()); // Key for forced re-rendering

	// Reset state when dialog state changes
	useEffect(() => {
		if (!open) {
			// Reset state when dialog is closed
			setEmailInput("");
			setEmailList([]);
			setRole("member");
			setError("");
			setIsLoading(false);
		}
	}, [open]);

	const handleOpenDialog = () => {
		setOpen(true);
		setDialogKey(Date.now()); // Update key to force re-rendering
	};

	const handleCloseDialog = () => {
		setOpen(false);
	};

	const addEmail = (emailToAdd: string) => {
		const trimmedEmail = emailToAdd.trim();
		if (!trimmedEmail) return;

		// Email format validation
		try {
			parse(pipe(string(), emailValidator()), trimmedEmail);
			// Check for duplicates
			if (
				!emailList.includes(trimmedEmail) &&
				!memberEmails.includes(trimmedEmail) &&
				!invitationEmails.includes(trimmedEmail)
			) {
				setEmailList((prev) => [...prev, trimmedEmail]);
			}
			setEmailInput("");
		} catch {
			setError(`Invalid email address: ${trimmedEmail}`);
		}
	};

	const removeEmail = (email: string) => {
		setEmailList((prev) => prev.filter((e) => e !== email));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addEmail(emailInput);
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pastedText = e.clipboardData.getData("text");
		const emails = pastedText.split(/[,;\s]+/);

		for (const email of emails) {
			if (email) addEmail(email);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (emailInput.trim()) {
			addEmail(emailInput);
		}

		if (emailList.length === 0) {
			setError("Please enter at least one email address");
			return;
		}

		setIsLoading(true);

		const response: SendInvitationsResult = await sendInvitationsAction(
			emailList,
			role,
		);

		if (response.overallStatus === "success") {
			handleCloseDialog();
		} else {
			const failedInvites = response.results.filter(
				(r) => r.status !== "success",
			);
			const errorMessages = failedInvites
				.map((r) => `${r.email}: ${r.error || r.status}`)
				.join(", ");
			let message = `Failed to send ${failedInvites.length} invitation(s).`;
			if (response.overallStatus === "partial_success") {
				const successCount = emailList.length - failedInvites.length;
				message = `${successCount} invitation(s) sent successfully. Failed to send ${failedInvites.length}: ${errorMessages}`;
			} else {
				message = `Failed to send all ${failedInvites.length} invitation(s): ${errorMessages}`;
			}
			setError(message);
		}
		setIsLoading(false);
	};

	return (
		<Dialog.Root open={open} onOpenChange={setOpen} key={dialogKey}>
			<Dialog.Trigger asChild>
				<button
					type="button"
					onClick={handleOpenDialog}
					className="group relative overflow-hidden rounded-lg px-4 py-2 text-white transition-all duration-300 hover:scale-[1.01] active:scale-95"
					style={{
						boxShadow:
							"0 8px 20px rgba(107, 143, 240, 0.2), 0 3px 10px rgba(107, 143, 240, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.08)",
					}}
				>
					{/* Outer glow */}
					<div
						className="absolute inset-0 -z-10 rounded-lg blur-[2px]"
						style={{ backgroundColor: "#6B8FF0", opacity: 0.08 }}
					/>

					{/* Main glass background */}
					<div
						className="absolute inset-0 rounded-lg backdrop-blur-md"
						style={{
							background:
								"linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(107,143,240,0.1) 50%, rgba(107,143,240,0.2) 100%)",
						}}
					/>

					{/* Top reflection */}
					<div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

					{/* Subtle border */}
					<div className="absolute inset-0 rounded-lg border border-white/20" />

					{/* Content */}
					<span className="relative z-10 flex items-center gap-2">
						<span className="grid size-4 place-items-center rounded-full bg-primary-200 opacity-50">
							<Plus className="size-3 text-black-900" />
						</span>
						<span className="text-[14px] font-medium leading-[20px]">
							Invite Member
						</span>
					</span>

					{/* Hover overlay */}
					<div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
				</button>
			</Dialog.Trigger>

			<GlassDialogContent
				onEscapeKeyDown={handleCloseDialog}
				onPointerDownOutside={handleCloseDialog}
			>
				<GlassDialogHeader
					title="Invite Team Member"
					description="Each member added to your team will be charged as an additional seat ($20 per seat) on your Pro Plan subscription."
					onClose={handleCloseDialog}
				/>
				<GlassDialogBody>
					<form
						id="invite-member-form"
						onSubmit={handleSubmit}
						className="space-y-4"
						noValidate
					>
						<div className="flex items-start gap-3 rounded-lg bg-black/80 p-1">
							<div className="flex min-h-[40px] flex-grow flex-wrap items-center gap-1">
								{emailList.map((email) => (
									<div
										key={email}
										className="mb-1 mr-2 flex items-center rounded-md bg-white/10 px-2.5 py-1.5 shadow-sm"
									>
										<span className="max-w-[180px] truncate text-[14px] text-white-400">
											{email}
										</span>
										<button
											type="button"
											onClick={() => removeEmail(email)}
											className="ml-1.5 text-black-300 hover:text-white-600"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								))}
								<input
									type="text"
									placeholder={
										emailList.length > 0
											? ""
											: "Email Addresses (separate with commas)"
									}
									value={emailInput}
									onChange={(e) => {
										setError("");
										setEmailInput(e.target.value);
									}}
									onKeyDown={handleKeyDown}
									onPaste={handlePaste}
									className="min-w-[200px] flex-1 border-none bg-transparent px-1 py-1 text-[14px] text-white-400 outline-none placeholder:text-white/30"
									disabled={isLoading}
								/>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className="flex h-10 items-center gap-1 rounded-md px-3 font-sans text-[14px] font-medium leading-[16px] text-white-400 hover:bg-white/5 hover:text-white-100"
										disabled={isLoading}
									>
										<span className="capitalize">{role}</span>
										<ChevronDown className="h-4 w-4 opacity-60" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="min-w-[120px] rounded-[8px] border-[0.25px] border-white/10 bg-black-850 p-1 shadow-none"
								>
									<button
										type="button"
										onClick={() => setRole("admin")}
										className="flex w-full items-center rounded-md px-3 py-2 text-left font-sans text-[14px] leading-[16px] text-white-400 hover:bg-white/5"
									>
										<span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
											{role === "admin" && <Check className="h-4 w-4" />}
										</span>
										Admin
									</button>
									<button
										type="button"
										onClick={() => setRole("member")}
										className="flex w-full items-center rounded-md px-3 py-2 text-left font-sans text-[14px] leading-[16px] text-white-400 hover:bg-white/5"
									>
										<span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
											{role === "member" && <Check className="h-4 w-4" />}
										</span>
										Member
									</button>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						{error && (
							<div className="mt-1 text-sm text-error-500">{error}</div>
						)}
					</form>
				</GlassDialogBody>
				<GlassDialogFooter
					onCancel={handleCloseDialog}
					onConfirm={() => {
						const form = document.getElementById(
							"invite-member-form",
						) as HTMLFormElement | null;
						if (!form) return;
						if (typeof form.requestSubmit === "function") {
							form.requestSubmit();
						} else {
							form.submit();
						}
					}}
					confirmLabel="Invite"
					isPending={isLoading}
				/>
			</GlassDialogContent>
		</Dialog.Root>
	);
}
