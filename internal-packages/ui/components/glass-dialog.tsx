import type { ComponentPropsWithoutRef } from "react";
import {
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPortal,
	Dialog as DialogRoot,
	DialogTitle,
	DialogTrigger,
	type DialogVariant,
} from "./dialog";

export type GlassDialogContentProps = ComponentPropsWithoutRef<
	typeof DialogContent
>;

export function GlassDialogContent(props: GlassDialogContentProps) {
	return <DialogContent variant={"glass" satisfies DialogVariant} {...props} />;
}

export {
	DialogRoot,
	DialogPortal,
	DialogTrigger,
	DialogClose,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogBody,
	DialogContent,
};
