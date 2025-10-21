import * as DialogPrimitive from "@radix-ui/react-dialog";
export declare function GlassDialogContent(
	props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
		variant?: "default" | "destructive";
	},
): import("react/jsx-runtime").JSX.Element;
export declare function GlassDialogHeader({
	title,
	description,
	onClose,
	variant,
}: {
	title: string;
	description: string;
	onClose: () => void;
	variant?: "default" | "destructive";
}): import("react/jsx-runtime").JSX.Element;
export declare function GlassDialogFooter({
	onCancel,
	onConfirm,
	confirmLabel,
	isPending,
	isConfirmDisabled,
	variant,
}: {
	onCancel: () => void;
	onConfirm?: () => void;
	confirmLabel: string;
	isPending?: boolean;
	isConfirmDisabled?: boolean;
	variant?: "default" | "destructive";
}): import("react/jsx-runtime").JSX.Element;
export declare function GlassDialogBody({
	children,
}: {
	children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=glass-dialog.d.ts.map
