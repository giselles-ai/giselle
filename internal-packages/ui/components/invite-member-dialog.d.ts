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
		errors?: {
			message: string;
			emails?: string[];
		}[];
	}>;
	memberEmails?: string[];
	invitationEmails?: string[];
	validateEmail?: (email: string) => boolean;
	confirmLabel?: string;
	className?: string;
}
export declare function InviteMemberDialog({
	trigger,
	title,
	description,
	placeholder,
	roles,
	defaultRole,
	onSubmit,
	memberEmails,
	invitationEmails,
	validateEmail,
	confirmLabel,
	className,
}: InviteMemberDialogProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=invite-member-dialog.d.ts.map
