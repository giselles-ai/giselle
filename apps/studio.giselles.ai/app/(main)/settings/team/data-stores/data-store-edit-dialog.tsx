import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { Input } from "@giselle-internal/ui/input";
import { useState, useTransition } from "react";
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
					<DialogTitle className="text-[20px] font-semibold text-white-900">
						Edit Data Store
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="mt-6 space-y-6">
					<div className="space-y-2">
						<div className="text-sm text-white-800">Name</div>
						<Input
							name="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Production Database"
							className="w-full"
							aria-label="Data store name"
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
								<Input
									name="connectionString"
									type="password"
									value={connectionString}
									onChange={(e) => setConnectionString(e.target.value)}
									placeholder="postgresql://user:password@host:5432/database"
									className="w-full font-mono text-sm"
									aria-label="PostgreSQL connection string"
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
						<Button
							type="button"
							variant="filled"
							size="large"
							disabled={isPending}
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="primary"
							size="large"
							disabled={isPending}
						>
							{isPending ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
