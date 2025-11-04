import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./dialog";
import { Button } from "./button";

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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent variant={variant} className={className}>
				{variant === "destructive" && (
					<div className="mb-4 flex justify-center">
						<div className="rounded-full bg-error-900/10 p-3">
							<AlertTriangle className="h-6 w-6 text-error-900" />
						</div>
					</div>
				)}
				<DialogHeader>
					<DialogTitle
						className={
							variant === "destructive"
								? "font-sans text-[20px] font-medium tracking-tight text-error-900"
								: "font-sans text-[20px] font-medium tracking-tight text-inverse"
						}
					>
						{title}
					</DialogTitle>
					<DialogDescription
						className={
							variant === "destructive" ? "text-error-900/50" : "text-text-muted"
						}
					>
						{email ? `${email}\n\n${description}` : description}
					</DialogDescription>
					<DialogClose className="text-inverse" />
				</DialogHeader>
				<DialogBody>
					{error && (
						<div className="mt-4 rounded-lg bg-error-900/10 px-3 py-2 text-center text-sm text-error-900">
							{error}
						</div>
					)}
				</DialogBody>
				<DialogFooter>
					<Button
						variant="link"
						onClick={() => onOpenChange?.(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						variant={variant === "destructive" ? "destructive" : "primary"}
						onClick={handleConfirm}
						disabled={isLoading}
					>
						{isLoading ? "Processing..." : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
