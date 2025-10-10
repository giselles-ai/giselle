import { Plus, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState } from "react";
import { Button } from "./button";
import {
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "./glass-dialog";
import { Select } from "./select";

export type InviteMemberRole = {
	value: string;
	label: string;
};

export interface InviteMemberDialogProps {
	trigger?: React.ReactNode;
	title?: string;
	description?: string;
	placeholder?: string;
	roles?: InviteMemberRole[];
	defaultRole?: string;
	onSubmit: (
		emails: string[],
		role: string,
	) => Promise<{
		success: boolean;
		errors?: { message: string; emails?: string[] }[];
	}>;
	memberEmails?: string[];
	invitationEmails?: string[];
	validateEmail?: (email: string) => boolean;
	confirmLabel?: string;
	className?: string;
}

export function InviteMemberDialog({
	trigger,
	title = "Invite Team Member",
	description,
	placeholder = "Email Addresses (separate with commas)",
	roles = [
		{ value: "member", label: "Member" },
		{ value: "admin", label: "Admin" },
	],
	defaultRole = "member",
	onSubmit,
	memberEmails = [],
	invitationEmails = [],
	validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
	confirmLabel = "Invite",
	className,
}: InviteMemberDialogProps) {
	const [open, setOpen] = useState(false);
	const [emailInput, setEmailInput] = useState("");
	const [emailTags, setEmailTags] = useState<string[]>([]);
	const [role, setRole] = useState(defaultRole);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<
		{ message: string; emails?: string[] }[]
	>([]);

	useEffect(() => {
		if (!open) {
			setEmailInput("");
			setEmailTags([]);
			setRole(defaultRole);
			setErrors([]);
			setIsLoading(false);
		}
	}, [open, defaultRole]);

	const addEmailTags = () => {
		if (!emailInput.trim()) return;

		const emails = emailInput
			.trim()
			.split(/[,;\s]+/)
			.filter((email) => email.trim());

		const uniqueEmails = [...new Set(emails)];
		const validTags: string[] = [];
		const invalidEmails: string[] = [];
		const duplicateEmails: string[] = [];

		for (const email of uniqueEmails) {
			if (!validateEmail(email)) {
				invalidEmails.push(email);
			} else if (emailTags.includes(email)) {
				duplicateEmails.push(email);
			} else {
				validTags.push(email);
			}
		}

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
		setErrors(errorList.length > 0 ? errorList : []);

		if (validTags.length > 0) {
			setEmailTags([...emailTags, ...validTags]);
		}

		if (invalidEmails.length > 0 || duplicateEmails.length > 0) {
			setEmailInput([...invalidEmails, ...duplicateEmails].join(", "));
		} else {
			setEmailInput("");
		}
	};

	const removeEmailTag = (emailToRemove: string) => {
		setEmailTags(emailTags.filter((email) => email !== emailToRemove));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addEmailTags();
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setErrors([]);

		const allEmails = [...emailTags];
		const inputText = emailInput.trim();
		if (inputText) {
			const inputEmails = inputText
				.split(/[,;\s]+/)
				.filter((email) => email.trim());
			allEmails.push(...inputEmails);
		}

		const uniqueEmails = Array.from(new Set(allEmails));

		if (uniqueEmails.length === 0) {
			setErrors([{ message: "Please enter at least one email address" }]);
			return;
		}

		const validEmails: string[] = [];
		const invalidEmails: string[] = [];
		const alreadyMembers: string[] = [];
		const alreadyInvited: string[] = [];

		for (const email of uniqueEmails) {
			if (!validateEmail(email)) {
				invalidEmails.push(email);
			} else if (memberEmails.includes(email)) {
				alreadyMembers.push(email);
			} else if (invitationEmails.includes(email)) {
				alreadyInvited.push(email);
			} else {
				validEmails.push(email);
			}
		}

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

		if (errorList.length > 0) {
			setErrors(errorList);
			return;
		}

		setIsLoading(true);
		const result = await onSubmit(validEmails, role);
		setIsLoading(false);

		if (result.success) {
			setOpen(false);
		} else if (result.errors) {
			setErrors(result.errors);
		}
	};

	return (
		<DialogPrimitive.Root open={open} onOpenChange={setOpen}>
			{trigger ? (
				<DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
			) : (
				<DialogPrimitive.Trigger asChild>
					<Button variant="solid" size="compact">
						<Plus className="size-3" />
						Invite Member
					</Button>
				</DialogPrimitive.Trigger>
			)}

			<GlassDialogContent className={className}>
				<GlassDialogHeader
					title={title}
					description={description || ""}
					onClose={() => setOpen(false)}
				/>

				<form onSubmit={handleSubmit} className="mt-4" id="invite-member-form">
					<div className="flex items-start gap-3 rounded-lg bg-inverse/5 p-1">
						<div className="flex min-h-[40px] flex-grow flex-wrap items-center gap-1 px-2">
							{emailTags.map((email) => (
								<div
									key={email}
									className="mb-1 mr-2 flex items-center rounded-md bg-inverse/10 px-2.5 py-1.5"
								>
									<span className="max-w-[180px] truncate text-[14px] text-text">
										{email}
									</span>
									<button
										type="button"
										onClick={() => removeEmailTag(email)}
										className="ml-1.5 text-text/40 hover:text-text/60"
										disabled={isLoading}
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							))}
							<input
								type="text"
								placeholder={
									emailTags.length > 0 ? "Add more emails..." : placeholder
								}
								value={emailInput}
								onChange={(e) => {
									setErrors([]);
									setEmailInput(e.target.value);
								}}
								onKeyDown={handleKeyDown}
								onBlur={() => addEmailTags()}
								className="min-w-[200px] flex-1 border-none bg-transparent px-1 py-1 text-[14px] text-text outline-none placeholder:text-text/30"
								disabled={isLoading}
							/>
						</div>
						<Select
							options={roles}
							placeholder="Select role"
							value={role}
							onValueChange={setRole}
							widthClassName="w-[120px]"
							triggerClassName="h-10"
						/>
					</div>

					{errors.length > 0 && (
						<div className="mt-3 space-y-1">
							{errors.map((error) => (
								<div
									key={`${error.message}-${error.emails?.join(",") || ""}`}
									className="text-sm text-error-900"
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
				<GlassDialogFooter
					onCancel={() => setOpen(false)}
					onConfirm={() => {
						const form = document.getElementById(
							"invite-member-form",
						) as HTMLFormElement;
						if (form) {
							if (typeof form.requestSubmit === "function") {
								form.requestSubmit();
							} else {
								form.submit();
							}
						}
					}}
					confirmLabel={confirmLabel}
					isPending={isLoading}
				/>
			</GlassDialogContent>
		</DialogPrimitive.Root>
	);
}
