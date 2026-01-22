import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { Input } from "@giselle-internal/ui/input";
import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "../../components/button";
import { updateDataStore } from "./actions";
import type { DataStoreListItem } from "./types";

type DataStoreEditDialogProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	dataStore: DataStoreListItem;
	onSuccess: () => void;
};

export function DataStoreEditDialog({
	isOpen,
	onOpenChange,
	dataStore,
	onSuccess,
}: DataStoreEditDialogProps) {
	const [name, setName] = useState(dataStore.name);
	const [updateConnection, setUpdateConnection] = useState(false);
	const [connectionString, setConnectionString] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		startTransition(async () => {
			const result = await updateDataStore(
				dataStore.id,
				name,
				updateConnection ? connectionString : undefined,
			);
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
			<DialogContent variant="glass">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="text-[20px] font-semibold text-white-900">
							Edit Data Store
						</DialogTitle>
						<DialogClose className="rounded-sm text-inverse opacity-70 hover:opacity-100 focus:outline-none">
							<X className="h-5 w-5" />
							<span className="sr-only">Close</span>
						</DialogClose>
					</div>
					<DialogDescription className="font-geist mt-2 text-[14px] text-text-muted">
						Update the name and connection string for this data store.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="mt-6 space-y-6">
					<div className="space-y-2">
						<label htmlFor="name" className="text-sm text-white-800">
							Name
						</label>
						<Input
							id="name"
							name="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Production Database"
							className="w-full"
							disabled={isPending}
							required
						/>
					</div>

					<div className="space-y-3">
						<label className="flex items-center gap-2 text-sm text-white-800 cursor-pointer">
							<input
								type="checkbox"
								checked={updateConnection}
								onChange={(e) => setUpdateConnection(e.target.checked)}
								disabled={isPending}
								className="rounded border-white-400 bg-transparent"
							/>
							Update connection string
						</label>

						{updateConnection && (
							<div className="space-y-2">
								<label
									htmlFor="connectionString"
									className="text-sm text-white-800"
								>
									Connection String
								</label>
								<Input
									id="connectionString"
									name="connectionString"
									type="password"
									value={connectionString}
									onChange={(e) => setConnectionString(e.target.value)}
									placeholder="postgresql://user:password@host:5432/database"
									className="w-full font-mono text-sm"
									disabled={isPending}
									required={updateConnection}
								/>
								<p className="text-xs text-text-muted">
									Your connection string is encrypted and stored securely.
								</p>
							</div>
						)}
					</div>

					{error && (
						<div className="rounded-md border border-error-500/40 bg-error-500/10 px-3 py-2 text-sm text-error-200">
							{error}
						</div>
					)}

					<DialogFooter>
						<div className="mt-6 flex justify-end gap-x-3">
							<Button
								type="button"
								variant="link"
								disabled={isPending}
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" variant="primary" disabled={isPending}>
								{isPending ? "Processing..." : "Save"}
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
