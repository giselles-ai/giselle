import { useToasts } from "@giselle-internal/ui/toast";
import {
	type WebPage,
	WebPageId,
	type WebPageNode,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import {
	useFeatureFlag,
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { TrashIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { type FormEventHandler, useCallback, useState } from "react";
import useSWR from "swr";
import { WebPageFileIcon } from "../../../icons";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";

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
	const client = useGiselleEngine();
	const { experimental_storage } = useFeatureFlag();
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
				useExperimentalStorage: experimental_storage,
			}),
	);

	return (
		<li
			key={webpage.id}
			className="group bg-white-850/10 p-[8px] rounded-[8px] flex items-center justify-between gap-[8px]"
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
						<Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50" />
						<Dialog.Content
							className="fixed left-[50%] top-[50%] max-h-[80vh] w-[600px] translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-[12px] bg-black-900 p-[24px] shadow-xl z-50 border border-black-400"
							onOpenAutoFocus={(e) => {
								e.preventDefault();
							}}
							onCloseAutoFocus={(e) => {
								e.preventDefault();
							}}
						>
							<Dialog.Title className="text-[18px] font-semibold text-white-800 mb-4">
								{webpage.title}
							</Dialog.Title>
							{isLoading ? (
								<p className="text-white-400">Loading...</p>
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
				<div>
					<p className="text-error-900 font-sans">
						Failed to fetch: {webpage.errorMessage}
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
			<button
				type="button"
				onClick={onRemove}
				className="cursor-pointer hidden group-hover:block p-[4px] hover:bg-white-850/10 rounded-[4px] transition-colors"
			>
				<TrashIcon className="size-[16px] text-white-600" />
			</button>
		</li>
	);
}

export function WebPageNodePropertiesPanel({ node }: { node: WebPageNode }) {
	const client = useGiselleEngine();
	const { experimental_storage } = useFeatureFlag();
	const { data, updateNodeData, updateNodeDataContent } = useWorkflowDesigner();
	const { error } = useToasts();
	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		async (e) => {
			e.preventDefault();

			const formData = new FormData(e.currentTarget);
			const urls =
				formData
					.get("urls")
					?.toString()
					.split("\n")
					.map((u) => u.trim())
					.filter((u) => u.length > 0) || [];
			if (urls.length === 0) {
				error("Please enter at least one valid URL.");
				return;
			}

			try {
				for (const url of urls) {
					const parsed = new URL(url);
					if (parsed.protocol !== "https:") {
						throw new Error("Invalid protocol");
					}
				}
			} catch {
				error("Invalid URL format. Use https://");
				return;
			}

			e.currentTarget.reset();
			let webpages: WebPage[] = node.content.webpages;
			await Promise.all(
				urls.map(async (url) => {
					const newWebPage: WebPage = {
						id: WebPageId.generate(),
						status: "fetching",
						url,
					};
					webpages = [...webpages, newWebPage];
					updateNodeDataContent(node, {
						webpages,
					});
					try {
						const addedWebPage = await client.addWebPage({
							webpage: newWebPage,
							workspaceId: data.id,
						});
						webpages = [
							...webpages.filter((webpage) => webpage.id !== addedWebPage.id),
							addedWebPage,
						];
						updateNodeDataContent(node, {
							webpages,
						});
					} catch (_err) {
						const failedWebPage: WebPage = {
							id: newWebPage.id,
							status: "failed",
							url: newWebPage.url,
							errorMessage: newWebPage.url,
						};
						webpages = [
							...webpages.filter((webpage) => webpage.id !== failedWebPage.id),
							failedWebPage,
						];
						updateNodeDataContent(node, {
							webpages,
						});
					}
				}),
			);
		},
		[client, data.id, node, updateNodeDataContent, error],
	);

	const removeWebPage = useCallback(
		(webpageId: WebPageId) => async () => {
			const webpage = node.content.webpages.find(
				(webpage) => webpage.id === webpageId,
			);
			if (webpage === undefined) {
				return;
			}
			updateNodeDataContent(node, {
				webpages: node.content.webpages.filter(
					(webpage) => webpage.id !== webpageId,
				),
			});
			if (webpage.status === "fetched") {
				await client.removeFile({
					workspaceId: data.id,
					fileId: webpage.fileId,
					useExperimentalStorage: experimental_storage,
				});
			}
		},
		[updateNodeDataContent, node, client, data.id, experimental_storage],
	);

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={<WebPageFileIcon className="size-[20px] text-black-900" />}
				node={node}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
			/>
			<PropertiesPanelContent>
				<div>
					<form className="flex flex-col gap-[8px]" onSubmit={handleSubmit}>
						<div className="flex flex-col gap-[8px]">
							<textarea
								id="webpage-urls"
								name="urls"
								className={clsx(
									"w-full min-h-[80px] p-[16px] pb-0 border-[0.5px] border-white-900 rounded-[8px] bg-black-100 text-white-800 outline-none resize-none",
									// urlError && "border-error-900",
								)}
								// value={urls}
								// onChange={(e) => setUrls(e.target.value)}
								placeholder={"URLs (one per line)\nhttps://example.com"}
								required
							/>
							{/* {urlError && (
							<p className="text-error-900 text-[12px]">{urlError}</p>
						)} */}
						</div>
						<button
							type="submit"
							className="w-full flex items-center justify-center gap-[4px] px-[16px] py-[8px] rounded-[8px] bg-blue-700 text-white-800 font-semibold hover:bg-blue-800 cursor-pointer"
						>
							Add
						</button>
					</form>

					{node.content.webpages.length > 0 && (
						<div className="mt-[16px]">
							<h3 className="text-[14px] font-semibold text-white-800 mb-[8px]">
								Added URLs
							</h3>
							<ul className="flex flex-col gap-[8px]">
								{node.content.webpages.map((webpage) => (
									<WebPageListItem
										key={webpage.id}
										webpage={webpage}
										workspaceId={data.id}
										onRemove={removeWebPage(webpage.id)}
									/>
								))}
							</ul>
						</div>
					)}
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
