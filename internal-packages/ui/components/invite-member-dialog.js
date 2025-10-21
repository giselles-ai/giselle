import { Plus, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState } from "react";
import {
	Fragment as _Fragment,
	jsx as _jsx,
	jsxs as _jsxs,
} from "react/jsx-runtime";
import { Button } from "./button";
import {
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "./glass-dialog";
import { Select } from "./select";
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
}) {
	const [open, setOpen] = useState(false);
	const [emailInput, setEmailInput] = useState("");
	const [emailTags, setEmailTags] = useState([]);
	const [role, setRole] = useState(defaultRole);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState([]);
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
		const validTags = [];
		const invalidEmails = [];
		const duplicateEmails = [];
		for (const email of uniqueEmails) {
			if (!validateEmail(email)) {
				invalidEmails.push(email);
			} else if (emailTags.includes(email)) {
				duplicateEmails.push(email);
			} else {
				validTags.push(email);
			}
		}
		const errorList = [];
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
	const removeEmailTag = (emailToRemove) => {
		setEmailTags(emailTags.filter((email) => email !== emailToRemove));
	};
	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addEmailTags();
		}
	};
	const handleSubmit = async (e) => {
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
		const validEmails = [];
		const invalidEmails = [];
		const alreadyMembers = [];
		const alreadyInvited = [];
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
		const errorList = [];
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
	return _jsxs(DialogPrimitive.Root, {
		open: open,
		onOpenChange: setOpen,
		children: [
			trigger
				? _jsx(DialogPrimitive.Trigger, { asChild: true, children: trigger })
				: _jsx(DialogPrimitive.Trigger, {
						asChild: true,
						children: _jsxs(Button, {
							variant: "solid",
							size: "compact",
							children: [_jsx(Plus, { className: "size-3" }), "Invite Member"],
						}),
					}),
			_jsxs(GlassDialogContent, {
				className: className,
				children: [
					_jsx(GlassDialogHeader, {
						title: title,
						description: description || "",
						onClose: () => setOpen(false),
					}),
					_jsxs("form", {
						onSubmit: handleSubmit,
						className: "mt-4",
						id: "invite-member-form",
						children: [
							_jsxs("div", {
								className: "flex items-start gap-3 rounded-lg bg-inverse/5 p-1",
								children: [
									_jsxs("div", {
										className:
											"flex min-h-[40px] flex-grow flex-wrap items-center gap-1 px-2",
										children: [
											emailTags.map((email) =>
												_jsxs(
													"div",
													{
														className:
															"mb-1 mr-2 flex items-center rounded-md bg-inverse/10 px-2.5 py-1.5",
														children: [
															_jsx("span", {
																className:
																	"max-w-[180px] truncate text-[14px] text-text",
																children: email,
															}),
															_jsx("button", {
																type: "button",
																onClick: () => removeEmailTag(email),
																className:
																	"ml-1.5 text-text/40 hover:text-text/60",
																disabled: isLoading,
																children: _jsx(X, { className: "h-4 w-4" }),
															}),
														],
													},
													email,
												),
											),
											_jsx("input", {
												type: "text",
												placeholder:
													emailTags.length > 0
														? "Add more emails..."
														: placeholder,
												value: emailInput,
												onChange: (e) => {
													setErrors([]);
													setEmailInput(e.target.value);
												},
												onKeyDown: handleKeyDown,
												onBlur: () => addEmailTags(),
												className:
													"min-w-[200px] flex-1 border-none bg-transparent px-1 py-1 text-[14px] text-text outline-none placeholder:text-text/30",
												disabled: isLoading,
											}),
										],
									}),
									_jsx(Select, {
										options: roles,
										placeholder: "Select role",
										value: role,
										onValueChange: setRole,
										widthClassName: "w-[120px]",
										triggerClassName: "h-10",
									}),
								],
							}),
							errors.length > 0 &&
								_jsx("div", {
									className: "mt-3 space-y-1",
									children: errors.map((error) => {
										var _a;
										return _jsx(
											"div",
											{
												className: "text-sm text-error-900",
												children:
													error.emails && error.emails.length > 0
														? _jsxs(_Fragment, {
																children: [
																	_jsxs("span", {
																		className: "font-medium",
																		children: [error.message, ":"],
																	}),
																	" ",
																	_jsx("span", {
																		children: error.emails.join(", "),
																	}),
																],
															})
														: _jsx("span", { children: error.message }),
											},
											`${error.message}-${((_a = error.emails) === null || _a === void 0 ? void 0 : _a.join(",")) || ""}`,
										);
									}),
								}),
						],
					}),
					_jsx(GlassDialogFooter, {
						onCancel: () => setOpen(false),
						onConfirm: () => {
							const form = document.getElementById("invite-member-form");
							if (form) {
								if (typeof form.requestSubmit === "function") {
									form.requestSubmit();
								} else {
									form.submit();
								}
							}
						},
						confirmLabel: confirmLabel,
						isPending: isLoading,
					}),
				],
			}),
		],
	});
}
//# sourceMappingURL=invite-member-dialog.js.map
