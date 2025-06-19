import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { EmptyState } from "@giselle-internal/ui/empty-state";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@giselle-internal/ui/table";
import clsx from "clsx/lite";
import { useGiselleEngine, useWorkflowDesigner } from "giselle-sdk/react";
import { PlusIcon } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { z } from "zod/v4";
import { useWorkspaceSecrets } from "../lib/use-workspace-secrets";

function formatDateTime(timestamp: number): string {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${year}/${month}/${day} ${hours}:${minutes}`;
}

const SecretPayload = z.object({
	label: z.string().min(1),
	value: z.string().min(1),
});

export function SecretTable() {
	const [presentDialog, setPresentDialog] = useState(false);
	const { data: workspace } = useWorkflowDesigner();
	const { isLoading, data, mutate } = useWorkspaceSecrets();
	const [isPending, startTransition] = useTransition();
	const client = useGiselleEngine();

	const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			const formData = new FormData(e.currentTarget);
			const label = formData.get("label");
			const value = formData.get("value");
			const parse = SecretPayload.safeParse({
				label,
				value,
			});
			if (!parse.success) {
				/** @todo Implement error handling */
				console.log(parse.error);
				return;
			}
			const payload = parse.data;
			startTransition(async () => {
				const result = await client.addSecret({
					workspaceId: workspace.id,
					label: payload.label,
					value: payload.value,
				});
				await mutate([...(data ?? []), result.secret]);
			});
			setPresentDialog(false);
		},
		[client, workspace.id, data, mutate],
	);

	if (isLoading) {
		return null;
	}
	if (data === undefined || data.length < 1) {
		return <EmptyState description="No secret" />;
	}
	return (
		<div className="p-[16px] bg-surface-background h-full">
			<div className="flex justify-between items-center">
				<h1 className="font-accent text-text text-[18px] mb-[8px]">Secrets</h1>
				<Dialog open={presentDialog} onOpenChange={setPresentDialog}>
					<DialogTrigger asChild>
						<Button type="button" leftIcon={<PlusIcon className="text-text" />}>
							Add new secret
						</Button>
					</DialogTrigger>
					<DialogContent>
						<div className="py-[12px]">
							<DialogTitle>Add new secret</DialogTitle>
							<DialogDescription>
								Enter a name and value for the secret.
							</DialogDescription>
						</div>
						<form onSubmit={handleSubmit}>
							<div className="flex flex-col gap-[12px]">
								<fieldset className="flex flex-col">
									<label
										htmlFor="label"
										className="text-text text-[13px] mb-[2px]"
									>
										Secret Name
									</label>
									<input
										type="text"
										id="label"
										name="label"
										className={clsx(
											"border border-border rounded-[4px] bg-editor-background outline-none px-[8px] py-[2px] text-[14px]",
											"focus:border-border-focused",
										)}
									/>
									<p className="text-[11px] text-text-muted px-[4px] mt-[1px]">
										Give this token a short name (e.g. “Prod-bot”). You’ll use
										it when linking other nodes.
									</p>
								</fieldset>
								<fieldset className="flex flex-col">
									<div className="flex justify-between mb-[2px]">
										<label htmlFor="pat" className="text-text text-[13px]">
											Value
										</label>
									</div>
									<input
										type="text"
										id="pat"
										name="value"
										className={clsx(
											"border border-border rounded-[4px] bg-editor-background outline-none px-[8px] py-[2px] text-[14px]",
											"focus:border-border-focused",
										)}
									/>
									<p className="text-[11px] text-text-muted px-[4px] mt-[1px]">
										We’ll encrypt the token with authenticated encryption before
										saving it.
									</p>
								</fieldset>
							</div>
							<DialogFooter>
								<button
									type="submit"
									className="flex items-center gap-[4px] text-[14px] text-text hover:bg-ghost-element-hover transition-colors px-[8px] rounded-[2px] cursor-pointer"
									disabled={isPending}
								>
									{isPending ? "..." : "Create"}
								</button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Created at</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((data) => (
						<TableRow key={data.id}>
							<TableCell>{data.label}</TableCell>
							<TableCell>{formatDateTime(data.createdAt)}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
