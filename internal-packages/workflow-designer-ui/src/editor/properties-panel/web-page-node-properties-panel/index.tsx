import { Button } from "@giselle-internal/ui/button";
import { useToasts } from "@giselle-internal/ui/toast";
import type { WebPage, WebPageNode, WorkspaceId } from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import { TrashIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { type FormEventHandler, useCallback, useState } from "react";
import useSWR from "swr";
import { useGiselle } from "../../../app-designer/store/giselle-client-provider";
import { useAppDesignerStore } from "../../../app-designer/store/hooks";
import {
	useAddWebPages,
	useDeleteNode,
	useRemoveWebPage,
	useUpdateNodeData,
} from "../../../app-designer/store/usecases";
import { NodePanelHeader } from "../ui/node-panel-header";
import { Note } from "../ui/note";
import { SettingLabel } from "../ui/setting-label";

function WebPageListItem({
	webpage,
	workspaceId,
	onRemove,
}: {
	webpage: WebPage;
	workspaceId: WorkspaceId;
	onRemove: () => void;
}) {
	const [open, setOpen] = useState(false);
	const client = useGiselle();
	const { isLoading, data } = useSWR(
		webpage.status !== "fetched"
			? null
			: {
					namespace: "get-file",
					workspaceId,
					fileId: webpage.fileId,
				},
		({ workspaceId, fileId }) =>
			client.getFileText({
				workspaceId,
				fileId,
			}),
	);

	return (
		<li
			key={webpage.id}
			className="group bg-bg-850/10 p-[8px] rounded-[8px] flex items-center justify-between gap-[8px]"
		>
			{webpage.status === "fetched" && (
				<Dialog.Root open={open} onOpenChange={setOpen}>
					<Dialog.Trigger asChild>
						<button
							type="button"
							className="text-left overflow-x-hidden cursor-pointer flex-1 outline-none"
						>
							<p className="text-[14px] truncate">{webpage.title}</p>
							<a
								className="text-[14px] underline truncate block"
								href={webpage.url}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(e) => {
									e.stopPropagation();
								}}
							>
								{webpage.url}
							</a>
						</button>
					</Dialog.Trigger>
					<Dialog.Portal>
						<Dialog.Overlay
							className="fixed inset-0 backdrop-blur-[2px] z-50"
							style={{
								backgroundColor:
									"color-mix(in srgb, var(--color-background, #00020b) 60%, transparent)",
							}}
						/>
						<Dialog.Content
							className="fixed left-[50%] top-[50%] max-h-[80vh] w-[600px] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[12px] bg-bg-900 p-[24px] shadow-xl z-50 border border-black-400"
							onOpenAutoFocus={(e) => {
								e.preventDefault();
							}}
							onCloseAutoFocus={(e) => {
								e.preventDefault();
							}}
						>
							<Dialog.Title className="text-[18px] font-semibold text-inverse mb-4">
								{webpage.title}
							</Dialog.Title>
							{isLoading ? (
								<p className="text-inverse">Loading...</p>
							) : (
								<div className="whitespace-pre-wrap text-white">
									{data?.text}
								</div>
							)}
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
			)}
			{webpage.status === "fetching" && (
				<div>
					<p className="font-sans bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-[rgba(200,200,200,_1)] via-[rgba(100,100,100,_0.5)] to-[rgba(200,200,200,_1)] text-transparent animate-shimmer">
						Fetching...
					</p>
					<a
						href={webpage.url}
						target="_blank"
						rel="noreferrer"
						className="text-[14px] underline"
					>
						{webpage.url}
					</a>
				</div>
			)}
			{webpage.status === "failed" && (
				<Note
					type="error"
					showIcon={false}
					action={
						<button
							type="button"
							onClick={onRemove}
							className="p-[4px] rounded-[6px] text-error-100 hover:text-error-200 hover:bg-error-900/10 transition-colors"
							aria-label="Remove failed URL"
						>
							<TrashIcon className="size-[14px]" />
						</button>
					}
				>
					<div className="flex flex-col">
						<span className="font-sans text-[14px]">Failed to fetch</span>
						<a
							href={webpage.url}
							target="_blank"
							rel="noreferrer"
							className="underline text-[12px]"
						>
							{webpage.url}
						</a>
					</div>
				</Note>
			)}
			{webpage.status !== "failed" && (
				<button
					type="button"
					onClick={onRemove}
					className="cursor-pointer hidden group-hover:block p-[4px] hover:bg-bg-850/10 rounded-[4px] transition-colors"
				>
					<TrashIcon className="size-[16px] text-text/60" />
				</button>
			)}
		</li>
	);
}

export function WebPageNodePropertiesPanel({ node }: { node: WebPageNode }) {
	const { error } = useToasts();
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const updateNodeData = useUpdateNodeData();
	const deleteNode = useDeleteNode();
	const addWebPages = useAddWebPages();
	const removeWebPage = useRemoveWebPage();

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		async (e) => {
			e.preventDefault();

			const formData = new FormData(e.currentTarget);
			const urls =
				formData
					.get("urls")
					?.toString()
					.split("\n")
					.map((u) => u.trim()) ?? [];

			e.currentTarget.reset();

			await addWebPages({
				nodeId: node.id,
				urls,
				onError: (message) => error(message),
			});
		},
		[addWebPages, error, node.id],
	);

	const handleRemoveWebPage = useCallback(
		(webpageId: WebPage["id"]) => async () => {
			await removeWebPage({ nodeId: node.id, webpageId });
		},
		[node.id, removeWebPage],
	);

	return (
		<div className="w-full flex flex-col gap-[8px]">
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/webpage-node"
				onDelete={() => deleteNode(node.id)}
			/>
			<div>
				<form className="flex flex-col gap-[8px]" onSubmit={handleSubmit}>
					<div className="flex flex-col gap-[8px]">
						<textarea
							id="webpage-urls"
							name="urls"
							className={clsx(
								"w-full min-h-[120px] rounded-[8px] bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px] outline-none resize-none border-none",
								"!pt-[4px] !pr-[8px] !pb-[4px] !pl-[12px]",
							)}
							placeholder={"URLs (one per line)\nhttps://example.com"}
							required
						/>
					</div>
					<div className="flex justify-end">
						<Button variant="filled" size="large" type="submit">
							Add
						</Button>
					</div>
				</form>

				{node.content.webpages.length > 0 && (
					<div className="mt-[16px]">
						<SettingLabel className="mb-[8px]">Added URLs</SettingLabel>
						<ul className="flex flex-col">
							{node.content.webpages.map((webpage) => (
								<WebPageListItem
									key={webpage.id}
									webpage={webpage}
									workspaceId={workspaceId}
									onRemove={handleRemoveWebPage(webpage.id)}
								/>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
