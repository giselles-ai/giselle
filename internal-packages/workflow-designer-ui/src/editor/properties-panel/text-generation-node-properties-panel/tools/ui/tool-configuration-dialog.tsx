import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	type DialogSize,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import type { ComponentProps, PropsWithChildren } from "react";

export interface ToolConfigurationDialogProps
	extends Omit<ComponentProps<typeof Dialog>, "children"> {
	title: string;
	description: string;
	onSubmit: React.FormEventHandler<HTMLFormElement>;
	submitting: boolean;
	trigger: React.ReactNode;
	disabled?: boolean;
	size?: DialogSize;
	submitText?: string;
}

export function ToolConfigurationDialog({
	open,
	onOpenChange,
	defaultOpen,
	children,
	onSubmit,
	submitting,
	title,
	description,
	trigger,
	disabled,
	size,
	submitText = "Save",
}: PropsWithChildren<ToolConfigurationDialogProps>) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent size={size}>
				<div className="mb-4">
					<DialogTitle className="text-[20px] font-medium text-text tracking-tight font-sans">
						{title}
					</DialogTitle>
					<DialogDescription className="text-[14px] text-text-muted font-geist mt-2">
						{description}
					</DialogDescription>
				</div>
				<form onSubmit={onSubmit}>
					{children}
					<DialogFooter>
						<Button
							type="submit"
							variant="solid"
							disabled={submitting || disabled}
							size="large"
						>
							{submitting ? "..." : submitText}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
