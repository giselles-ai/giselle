import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "../../components/button";
import { deleteDataStore } from "./actions";
import type { DataStoreListItem } from "./types";

type DataStoreDeleteDialogProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	dataStore: DataStoreListItem;
	onSuccess: () => void;
};

export function DataStoreDeleteDialog({
	isOpen,
	onOpenChange,
	dataStore,
	onSuccess,
}: DataStoreDeleteDialogProps) {
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleConfirmDelete = () => {
		setError(null);
		startTransition(async () => {
			const result = await deleteDataStore(dataStore.id);
			if (result.success) {
				onSuccess();
			} else {
				setError(result.error);
			}
		});
	};

	const handleDialogOpenChange = (open: boolean) => {
		if (!open && isPending) {
			return;
		}
		onOpenChange(open);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
			<DialogContent variant="destructive">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="font-sans text-[20px] font-medium tracking-tight text-error-900">
							Delete Data Store
						</DialogTitle>
						<DialogClose className="rounded-sm text-inverse opacity-70 hover:opacity-100 focus:outline-none">
							<X className="h-5 w-5" />
							<span className="sr-only">Close</span>
						</DialogClose>
					</div>
					<DialogDescription className="font-geist mt-2 text-[14px] text-error-900/50">
						{`This action cannot be undone. This will permanently delete the data store "${dataStore.name}".`}
					</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="rounded-md border border-error-500/40 bg-error-500/10 px-3 py-2 text-sm text-error-200 mt-4">
						{error}
					</div>
				)}

				<DialogFooter>
					<div className="mt-6 flex justify-end gap-x-3">
						<Button
							variant="link"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleConfirmDelete}
							disabled={isPending}
						>
							{isPending ? "Processing..." : "Delete"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
