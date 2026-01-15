import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { Input } from "@giselle-internal/ui/input";
import { useState, useTransition } from "react";
import { Button } from "../../components/button";
import { createDataStore } from "./actions";

type DataStoreCreateDialogProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
};

export function DataStoreCreateDialog({
	isOpen,
	onOpenChange,
	onSuccess,
}: DataStoreCreateDialogProps) {
	const [name, setName] = useState("");
	const [connectionString, setConnectionString] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		startTransition(async () => {
			const result = await createDataStore(name, connectionString);
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
						New Data Store
					</DialogTitle>
					<DialogDescription className="font-geist mt-2 text-[14px] text-text-muted">
						Add a PostgreSQL database connection to use it in Data Store Nodes.
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
							required
						/>
						<p className="text-xs text-text-muted">
							Your connection string is encrypted and stored securely.
						</p>
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
								{isPending ? "Creating..." : "Create"}
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
