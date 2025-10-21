export interface RevokeInvitationDialogProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	title?: string;
	description?: string;
	email?: string;
	confirmLabel?: string;
	onConfirm: () => Promise<{
		success: boolean;
		error?: string;
	}>;
	variant?: "default" | "destructive";
	className?: string;
}
export declare function RevokeInvitationDialog({
	open,
	onOpenChange,
	title,
	description,
	email,
	confirmLabel,
	onConfirm,
	variant,
	className,
}: RevokeInvitationDialogProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=revoke-invitation-dialog.d.ts.map
