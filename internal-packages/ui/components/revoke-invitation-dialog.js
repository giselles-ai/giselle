import { AlertTriangle } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "./glass-dialog";
export function RevokeInvitationDialog({
	open,
	onOpenChange,
	title = "Revoke Invitation",
	description = "This will permanently revoke this invitation and prevent the user from joining your team.",
	email,
	confirmLabel = "Revoke",
	onConfirm,
	variant = "destructive",
	className,
}) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const handleConfirm = async () => {
		setError("");
		setIsLoading(true);
		const result = await onConfirm();
		if (result.success) {
			onOpenChange === null || onOpenChange === void 0
				? void 0
				: onOpenChange(false);
		} else if (result.error) {
			setError(result.error);
		}
		setIsLoading(false);
	};
	return _jsx(DialogPrimitive.Root, {
		open: open,
		onOpenChange: onOpenChange,
		children: _jsxs(GlassDialogContent, {
			variant: variant,
			className: className,
			children: [
				variant === "destructive" &&
					_jsx("div", {
						className: "mb-4 flex justify-center",
						children: _jsx("div", {
							className: "rounded-full bg-error-900/10 p-3",
							children: _jsx(AlertTriangle, {
								className: "h-6 w-6 text-error-900",
							}),
						}),
					}),
				_jsx(GlassDialogHeader, {
					title: title,
					description: email ? `${email}\n\n${description}` : description,
					onClose: () =>
						onOpenChange === null || onOpenChange === void 0
							? void 0
							: onOpenChange(false),
					variant: variant,
				}),
				error &&
					_jsx("div", {
						className:
							"mt-4 rounded-lg bg-error-900/10 px-3 py-2 text-center text-sm text-error-900",
						children: error,
					}),
				_jsx(GlassDialogFooter, {
					onCancel: () =>
						onOpenChange === null || onOpenChange === void 0
							? void 0
							: onOpenChange(false),
					onConfirm: handleConfirm,
					confirmLabel: confirmLabel,
					isPending: isLoading,
					variant: variant,
				}),
			],
		}),
	});
}
//# sourceMappingURL=revoke-invitation-dialog.js.map
