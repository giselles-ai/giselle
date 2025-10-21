import { Dialog as DialogPrimitive } from "radix-ui";
import type { PropsWithChildren } from "react";
export declare const Dialog: import("react").FC<DialogPrimitive.DialogProps>;
export declare const DialogPortal: import("react").FC<DialogPrimitive.DialogPortalProps>;
export declare const DialogTrigger: import("react").ForwardRefExoticComponent<
	DialogPrimitive.DialogTriggerProps &
		import("react").RefAttributes<HTMLButtonElement>
>;
export type DialogSize = "default" | "wide";
export declare function DialogContent({
	children,
	size,
}: PropsWithChildren<{
	size?: DialogSize;
}>): import("react/jsx-runtime").JSX.Element;
export declare function DialogTitle({
	children,
	className,
}: PropsWithChildren<{
	className?: string;
}>): import("react/jsx-runtime").JSX.Element;
export declare function DialogDescription({
	children,
	className,
}: PropsWithChildren<{
	className?: string;
}>): import("react/jsx-runtime").JSX.Element;
export declare function DialogFooter({
	children,
}: PropsWithChildren): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=dialog.d.ts.map
