import type { FileData } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { Dialog } from "radix-ui";
import { toRelativeTime } from "../../../helper/datetime";
import { RemoveButton } from "../ui";
import type { FilePanelProps } from "./file-panel-type";
import { useWebPageFileNode } from "./use-web-page-file-node";

export function WebPageFilePanel({ node, config }: FilePanelProps) {
	const {
		urls,
		setUrls,
		format,
		setFormat,
		onFetch,
		onRemoveFile,
		isLoading,
		files,
		urlError,
	} = useWebPageFileNode(node);

	return (
		<div className="relative z-10 flex flex-col gap-[2px] h-full text-[14px] text-black-300">
			<div className="p-[16px]">
				{/* Fetched Files List */}
				{files.length > 0 && (
					<div className="pb-[16px] flex flex-col gap-[8px]">
						{files.map((file: FileData) => (
							<WebPageFileListItem
								key={file.id}
								fileData={file}
								onRemove={onRemoveFile}
							/>
						))}
					</div>
				)}

				{/* URL Input */}
				<div className="py-[16px] flex flex-col gap-[8px]">
					<label
						htmlFor="webpage-urls"
						className="font-semibold text-white-800"
					>
						URLs (one per line)
					</label>
					<textarea
						id="webpage-urls"
						className={clsx(
							"w-full min-h-[80px] p-[8px] border border-black-400 rounded-[8px] bg-black-100 text-white-800",
							urlError && "border-error-900",
						)}
						value={urls}
						onChange={(e) => setUrls(e.target.value)}
						placeholder={"https://example.com\nhttps://docs.giselles.ai"}
						required
					/>
					{urlError && <p className="text-error-900 text-[12px]">{urlError}</p>}
				</div>

				{/* Format Select */}
				<div className="py-[16px] flex flex-col gap-[8px]">
					<label
						htmlFor="webpage-format"
						className="font-semibold text-white-800"
					>
						Output Format
					</label>
					<div className="flex gap-[16px] items-center">
						<label className="flex items-center gap-[4px] cursor-pointer">
							<input
								type="radio"
								name="webpage-format"
								value="markdown"
								checked={format === "markdown"}
								onChange={() => setFormat("markdown")}
								className="accent-blue-700"
							/>
							<span>Markdown</span>
						</label>
						<label className="flex items-center gap-[4px] cursor-pointer">
							<input
								type="radio"
								name="webpage-format"
								value="html"
								checked={format === "html"}
								onChange={() => setFormat("html")}
								className="accent-blue-700"
							/>
							<span>HTML</span>
						</label>
					</div>
				</div>

				{/* Fetch Button & Status */}
				<div className="py-[16px] flex flex-col gap-[8px]">
					<button
						type="button"
						className="w-fit px-[16px] py-[8px] rounded-[8px] bg-blue-700 text-white-800 font-semibold hover:bg-blue-800 disabled:bg-black-400"
						onClick={onFetch}
						disabled={isLoading || !urls.trim()}
					>
						{isLoading ? "Fetching..." : "Fetch Web Pages"}
					</button>
				</div>
			</div>
		</div>
	);
}

function WebPageFileListItem({
	fileData,
	onRemove,
}: {
	fileData: FileData;
	onRemove: (file: FileData) => void;
}) {
	return (
		<div className="flex items-center overflow-x-hidden group justify-between bg-black-100 hover:bg-white-900/10 transition-colors p-[8px] rounded-[8px]">
			<div className="flex items-center overflow-x-hidden">
				<div className="overflow-x-hidden">
					<p className="truncate">{fileData.name}</p>
					{fileData.status === "uploading" && <p>Uploading...</p>}
					{fileData.status === "uploaded" && (
						<p className="text-black-50">
							{toRelativeTime(fileData.uploadedAt)}
						</p>
					)}
					{fileData.status === "failed" && <p>Failed</p>}
				</div>
			</div>

			{fileData.status === "failed" ? (
				<RemoveButton onClick={() => onRemove(fileData)} />
			) : (
				<Dialog.Root>
					<Dialog.Trigger asChild>
						<RemoveButton />
					</Dialog.Trigger>
					<Dialog.Portal>
						<Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50" />
						<Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[400px] bg-black-900 rounded-[12px] p-[24px] shadow-xl z-50 border border-black-400">
							<Dialog.Title className="text-[18px] font-semibold text-white-800 mb-4">
								Confirm Removal
							</Dialog.Title>
							<Dialog.Description className="text-[14px] text-white-400 mb-6">
								Are you sure you want to remove this file?
							</Dialog.Description>
							<div className="flex justify-end gap-[12px]">
								<Dialog.Close asChild>
									<button
										type="button"
										className="py-[8px] px-[16px] rounded-[8px] text-[14px] font-medium bg-transparent text-white-800 border border-black-400 hover:bg-white-900/10"
									>
										Cancel
									</button>
								</Dialog.Close>
								<button
									type="button"
									className="py-[8px] px-[16px] rounded-[8px] text-[14px] font-medium bg-error-900 text-white-800 hover:bg-error-900/80"
									onClick={() => onRemove(fileData)}
								>
									Remove
								</button>
							</div>
							<Dialog.Close
								className="hidden"
								tabIndex={-1}
								aria-hidden="true"
							/>
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
			)}
		</div>
	);
}
