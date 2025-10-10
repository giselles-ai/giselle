import { AlertTriangle } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState } from "react";
import {
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "./glass-dialog";

export interface RevokeInvitationDialogProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	title?: string;
	description?: string;
	email?: string;
	confirmLabel?: string;
	onConfirm: () => Promise<{ success: boolean; error?: string }>;
	variant?: "default" | "destructive";
	className?: string;
}

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
}: RevokeInvitationDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleConfirm = async () => {
		setError("");
		setIsLoading(true);

		const result = await onConfirm();

		if (result.success) {
			onOpenChange?.(false);
		} else if (result.error) {
			setError(result.error);
		}

		setIsLoading(false);
	};

	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<GlassDialogContent variant={variant} className={className}>
				{variant === "destructive" && (
					<div className="mb-4 flex justify-center">
						<div className="rounded-full bg-error-900/10 p-3">
							<AlertTriangle className="h-6 w-6 text-error-900" />
						</div>
					</div>
				)}
				<GlassDialogHeader
					title={title}
					description={email ? `${email}\n\n${description}` : description}
					onClose={() => onOpenChange?.(false)}
					variant={variant}
				/>
				{error && (
					<div className="mt-4 rounded-lg bg-error-900/10 px-3 py-2 text-center text-sm text-error-900">
						{error}
					</div>
				)}
				<GlassDialogFooter
					onCancel={() => onOpenChange?.(false)}
					onConfirm={handleConfirm}
					confirmLabel={confirmLabel}
					isPending={isLoading}
					variant={variant}
				/>
			</GlassDialogContent>
		</DialogPrimitive.Root>
	);
}
