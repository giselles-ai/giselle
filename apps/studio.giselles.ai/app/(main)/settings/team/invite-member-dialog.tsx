"use client";

import {
	GlassDialogBody,
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "@giselle-internal/ui/glass-dialog";
import { Select } from "@giselle-internal/ui/select";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { email as emailValidator, parse, pipe, string } from "valibot";
import { GlassButton } from "@/components/ui/glass-button";
import type { TeamRole } from "@/drizzle";
import { type SendInvitationsResult, sendInvitationsAction } from "./actions";

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
	const [emailTags, setEmailTags] = useState<string[]>([]);
	const [role, setRole] = useState<TeamRole>("member");
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<
		{ message: string; emails?: string[] }[]
	>([]);
	const [dialogKey, setDialogKey] = useState(Date.now()); // Key for forced re-rendering

	// Reset state when dialog state changes
	useEffect(() => {
		if (!open) {
			// Reset state when dialog is closed
			setEmailInput("");
			setEmailTags([]);
			setRole("member");
			setErrors([]);
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

	const addEmailTags = () => {
		if (!emailInput.trim()) return;

		// Parse and validate emails
		const emails = emailInput
			.trim()
			.split(/[,;\s]+/)
			.filter((email) => email.trim());

		// Remove duplicates within the input batch
		const uniqueEmails = [...new Set(emails)];

		const validTags: string[] = [];
		const invalidEmails: string[] = [];
		const duplicateEmails: string[] = [];

		for (const email of uniqueEmails) {
			try {
				// Validate email format
				parse(pipe(string(), emailValidator()), email);

				// Check if already in tags
				if (emailTags.includes(email)) {
					duplicateEmails.push(email);
				} else {
					validTags.push(email);
				}
			} catch {
				invalidEmails.push(email);
			}
		}

		// Show errors
		const errorList: { message: string; emails?: string[] }[] = [];
		if (invalidEmails.length > 0) {
			errorList.push({
				message: "Invalid email addresses",
				emails: invalidEmails,
			});
		}
		if (duplicateEmails.length > 0) {
			errorList.push({ message: "Already added", emails: duplicateEmails });
		}
		if (errorList.length > 0) {
			setErrors(errorList);
		} else {
			setErrors([]);
		}

		// Add valid tags
		if (validTags.length > 0) {
			setEmailTags([...emailTags, ...validTags]);
		}

		// Update input field
		if (invalidEmails.length > 0 || duplicateEmails.length > 0) {
			// Keep problematic emails in input for correction
			setEmailInput([...invalidEmails, ...duplicateEmails].join(", "));
		} else {
			// Clear input when all emails were processed successfully
			setEmailInput("");
		}
	};

	const removeEmailTag = (emailToRemove: string) => {
		setEmailTags(emailTags.filter((email) => email !== emailToRemove));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			// Just add to tags, don't submit
			addEmailTags();
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		processInvitations();
	};

	// Helper function to parse and combine emails from tags and input
	const parseAndCombineEmails = (): string[] => {
		const allEmails = [...emailTags];

		const inputText = emailInput.trim();
		if (inputText) {
			const inputEmails = inputText
				.split(/[,;\s]+/)
				.filter((email) => email.trim());
			allEmails.push(...inputEmails);
		}

		// Remove duplicates
		return Array.from(new Set(allEmails));
	};

	// Helper function to validate and categorize emails
	const validateAndCategorizeEmails = (uniqueEmails: string[]) => {
		const validEmails: string[] = [];
		const invalidEmails: string[] = [];
		const alreadyMembers: string[] = [];
		const alreadyInvited: string[] = [];

		for (const email of uniqueEmails) {
			try {
				parse(pipe(string(), emailValidator()), email);

				// Check if already a member
				if (memberEmails.includes(email)) {
					alreadyMembers.push(email);
				}
				// Check if already invited
				else if (invitationEmails.includes(email)) {
					alreadyInvited.push(email);
				}
				// Valid email to send
				else {
					validEmails.push(email);
				}
			} catch {
				invalidEmails.push(email);
			}
		}

		return { validEmails, invalidEmails, alreadyMembers, alreadyInvited };
	};

	// Helper function to build error messages from categorized emails
	const buildErrorMessages = (
		invalidEmails: string[],
		alreadyMembers: string[],
		alreadyInvited: string[],
	): { message: string; emails?: string[] }[] => {
		const errorList: { message: string; emails?: string[] }[] = [];

		if (invalidEmails.length > 0) {
			errorList.push({
				message: "Invalid email addresses",
				emails: invalidEmails,
			});
		}

		if (alreadyMembers.length > 0) {
			errorList.push({
				message: "Already team members",
				emails: alreadyMembers,
			});
		}

		if (alreadyInvited.length > 0) {
			errorList.push({ message: "Already invited", emails: alreadyInvited });
		}

		return errorList;
	};

	// Helper function to build error messages from API response
	const buildApiErrorMessages = (
		response: SendInvitationsResult,
		validEmailsCount: number,
	): { message: string; emails?: string[] }[] => {
		const failedInvites = response.results.filter(
			(r) => r.status !== "success",
		);

		// Group errors by type
		const errorGroups: Record<string, string[]> = {};
		for (const result of failedInvites) {
			let errorKey = result.error || result.status || "unknown";

			// Map technical errors to user-friendly messages
			if (errorKey.includes("already a member")) {
				errorKey = "Already team members";
			} else if (errorKey.includes("active invitation already exists")) {
				errorKey = "Already invited";
			}

			if (!errorGroups[errorKey]) {
				errorGroups[errorKey] = [];
			}
			errorGroups[errorKey].push(result.email);
		}

		// Build the error array
		const errorList: { message: string; emails?: string[] }[] = [];

		if (response.overallStatus === "partial_success") {
			const successCount = validEmailsCount - failedInvites.length;
			errorList.push({
				message: `${successCount} invitation(s) sent successfully.`,
			});
		}

		// Add grouped error messages
		for (const [errorKey, emails] of Object.entries(errorGroups)) {
			errorList.push({
				message: errorKey,
				emails: emails,
			});
		}

		return errorList;
	};

	const processInvitations = async () => {
		setErrors([]);

		// Parse and combine emails
		const uniqueEmails = parseAndCombineEmails();

		// Check if we have any emails
		if (uniqueEmails.length === 0) {
			setErrors([{ message: "Please enter at least one email address" }]);
			return;
		}

		// Validate and categorize emails
		const { validEmails, invalidEmails, alreadyMembers, alreadyInvited } =
			validateAndCategorizeEmails(uniqueEmails);

		// Build error messages for validation issues
		const validationErrors = buildErrorMessages(
			invalidEmails,
			alreadyMembers,
			alreadyInvited,
		);

		if (validationErrors.length > 0) {
			setErrors(validationErrors);
			return;
		}

		setIsLoading(true);

		const response: SendInvitationsResult = await sendInvitationsAction(
			validEmails,
			role,
		);

		if (response.overallStatus === "success") {
			handleCloseDialog();
		} else {
			const apiErrors = buildApiErrorMessages(response, validEmails.length);
			setErrors(apiErrors);
		}
		setIsLoading(false);
	};

	return (
		<Dialog.Root open={open} onOpenChange={setOpen} key={dialogKey}>
			<Dialog.Trigger asChild>
				<GlassButton type="button" onClick={handleOpenDialog}>
					<span className="grid size-4 place-items-center rounded-full bg-primary-200 opacity-50">
						<Plus className="size-3 text-black-900" />
					</span>
					<span className="text-[14px] font-medium leading-[20px]">
						Invite Member
					</span>
				</GlassButton>
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
						<div className="flex items-start gap-3 rounded-lg bg-bg p-1">
							<div className="flex min-h-[40px] flex-grow flex-wrap items-center gap-1">
								{emailTags.map((email) => (
									<div
										key={email}
										className="mb-1 mr-2 flex items-center rounded-md bg-white/10 px-2.5 py-1.5 shadow-sm"
									>
										<span className="max-w-[180px] truncate text-[14px] text-white-400">
											{email}
										</span>
										<button
											type="button"
											onClick={() => removeEmailTag(email)}
											className="ml-1.5 text-black-300 hover:text-white-600"
											disabled={isLoading}
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								))}
								<input
									type="text"
									placeholder={
										emailTags.length > 0
											? "Add more emails..."
											: "Email Addresses (separate with commas)"
									}
									value={emailInput}
									onChange={(e) => {
										setErrors([]);
										setEmailInput(e.target.value);
									}}
									onKeyDown={handleKeyDown}
									onBlur={() => addEmailTags()}
									className="min-w-[200px] flex-1 border-none bg-transparent px-1 py-1 text-[14px] text-white-400 outline-none placeholder:text-white/30"
									disabled={isLoading}
								/>
							</div>
							<Select
								id="invite-role"
								options={[
									{ value: "admin", label: "Admin" },
									{ value: "member", label: "Member" },
								]}
								placeholder="Role"
								value={role}
								onValueChange={(v) => setRole(v as TeamRole)}
								widthClassName="w-auto min-w-[140px]"
								triggerClassName="h-10"
							/>
						</div>
						{errors.length > 0 && (
							<div className="mt-1 space-y-1">
								{errors.map((error) => (
									<div
										key={`${error.message}-${error.emails?.join(",") || ""}`}
										className="text-sm text-error-500"
									>
										{error.emails && error.emails.length > 0 ? (
											<>
												<span className="font-medium">{error.message}:</span>{" "}
												<span>{error.emails.join(", ")}</span>
											</>
										) : (
											<span>{error.message}</span>
										)}
									</div>
								))}
							</div>
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
