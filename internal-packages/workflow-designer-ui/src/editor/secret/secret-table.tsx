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

import { isTextGenerationNode, type SecretId } from "@giselle-sdk/data-type";
import {
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { PlusIcon, TrashIcon } from "lucide-react";
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
	const { data: workspace, updateNodeDataContent } = useWorkflowDesigner();
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

	const handleDelete = useCallback(
		(secretId: SecretId) => {
			startTransition(async () => {
				for (const node of workspace.nodes) {
					if (!isTextGenerationNode(node)) {
						continue;
					}
					const tools = node.content.tools;
					if (!tools) {
						continue;
					}
					let changed = false;
					const newTools = { ...tools };
					if (
						tools.github?.auth.type === "secret" &&
						tools.github.auth.secretId === secretId
					) {
						newTools.github = undefined;
						changed = true;
					}
					if (tools.postgres?.secretId === secretId) {
						newTools.postgres = undefined;
						changed = true;
					}
					if (changed) {
						updateNodeDataContent(node, {
							...node.content,
							tools: newTools,
						});
					}
				}

				await client.deleteSecret({
					workspaceId: workspace.id,
					secretId,
				});
				await mutate((data ?? []).filter((secret) => secret.id !== secretId));
			});
		},
		[
			client,
			workspace.id,
			data,
			mutate,
			workspace.nodes,
			updateNodeDataContent,
		],
	);

	if (isLoading) {
		return null;
	}
	return (
		<div className="pl-[16px] pb-[16px] pt-[8px] h-full">
			<div className="flex justify-end items-center">
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
										type="password"
										autoComplete="off"
										data-1p-ignore
										data-lpignore="true"
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
								<Button
									type="submit"
									variant="solid"
									size="large"
									disabled={isPending}
								>
									{isPending ? "..." : "Create"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>
			{data === undefined || data.length < 1 ? (
				<EmptyState description="No secret" />
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Created at</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((data) => (
							<TableRow key={data.id}>
								<TableCell>{data.label}</TableCell>
								<TableCell>{formatDateTime(data.createdAt)}</TableCell>
								<TableCell className="w-[1%] whitespace-nowrap">
									<Button
										variant="outline"
										size="compact"
										leftIcon={<TrashIcon className="size-[12px]" />}
										onClick={() => handleDelete(data.id)}
										disabled={isPending}
									>
										Delete
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
