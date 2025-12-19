"use client";

import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";

export type ConfirmOptions = {
	title?: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
};

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: PropsWithChildren) {
	const resolveRef = useRef<((value: boolean) => void) | null>(null);
	const [open, setOpen] = useState(false);
	const [options, setOptions] = useState<ConfirmOptions>({});

	const close = useCallback(() => {
		setOpen(false);
	}, []);

	const settle = useCallback(
		(value: boolean) => {
			resolveRef.current?.(value);
			resolveRef.current = null;
			close();
		},
		[close],
	);

	const confirm = useCallback<ConfirmFn>((nextOptions) => {
		// If confirm is called while another is open, cancel the previous one.
		resolveRef.current?.(false);
		resolveRef.current = null;

		setOptions(nextOptions ?? {});
		setOpen(true);
		return new Promise<boolean>((resolve) => {
			resolveRef.current = resolve;
		});
	}, []);

	const value = useMemo(() => confirm, [confirm]);

	const title = options.title ?? "Confirm";
	const description = options.description ?? "";
	const confirmLabel = options.confirmLabel ?? "OK";
	const cancelLabel = options.cancelLabel ?? "Cancel";
	const destructive = options.destructive ?? false;

	return (
		<ConfirmContext value={value}>
			{children}
			<Dialog
				open={open}
				onOpenChange={(nextOpen) => {
					// Closing via escape/overlay should behave like cancel.
					if (!nextOpen) {
						settle(false);
						return;
					}
					setOpen(true);
				}}
			>
				<DialogContent variant={destructive ? "destructive" : "glass"}>
					<DialogHeader>
						<DialogTitle className="text-[16px] font-semibold text-inverse">
							{title}
						</DialogTitle>
						{description !== "" && (
							<DialogDescription className="mt-2 text-inverse/70">
								{description}
							</DialogDescription>
						)}
					</DialogHeader>
					<DialogFooter>
						<Button variant="solid" onClick={() => settle(false)}>
							{cancelLabel}
						</Button>
						<Button
							variant={destructive ? "destructive" : "solid"}
							onClick={() => settle(true)}
						>
							{confirmLabel}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</ConfirmContext>
	);
}

export function useConfirm() {
	const ctx = useContext(ConfirmContext);
	if (!ctx) {
		throw new Error("useConfirm must be used within ConfirmProvider");
	}
	return ctx;
}
