import type { FileData, FileNode } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { useFeatureFlag } from "giselle-sdk/react";
import { ArrowUpFromLineIcon, FileXIcon, TrashIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { toRelativeTime } from "../../../../helper/datetime";
import { TriangleAlert } from "../../../../icons";
import { FileNodeIcon } from "../../../../icons/node";
import { useToasts } from "../../../../ui/toast";
import { RemoveButton } from "../../../properties-panel/ui";
import type { FilePanelProps } from "./file-panel-type";
import { useFileNode } from "./use-file-node";

/**
 * Hard limit to upload file since Vercel Serverless Functions have a 4.5MB body size limit
 * @see https://vercel.com/guides/how-to-bypass-vercel-body-size-limit-serverless-functions#measure-response-body-size
 * @todo implement streaming or alternative solution to support larger files (up to 20MB)
 */
const defaultMaxSize = 1024 * 1024 * 4.5;

class FileUploadError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FileUploadError";
	}
}

class InvalidFileTypeError extends FileUploadError {
	expectedType: string[];
	actualType: string;

	constructor(expectedType: string[], actualType: string) {
		super(`Invalid file type: ${actualType || "unknown type"}`);
		this.actualType = actualType;
		this.expectedType = expectedType;
		this.name = "InvalidFileTypeError";
		this.message = `This node supports ${expectedType.join(", ")}, but ${actualType ? `got ${actualType}.` : "the file type could not be determined."} ${this.suggestion()}`;
	}

	suggestion() {
		if (!this.actualType) {
			return "Please check if the file format is supported.";
		}

		switch (this.actualType) {
			case "image/jpeg":
			case "image/png":
			case "image/gif":
			case "image/svg":
				return "Please use Image node to upload this file.";
			case "application/pdf":
				return "Please use PDF node to upload this file.";
			case "text/plain":
			case "text/markdown":
				return "Please use Text node to upload this file.";
			default:
				return `${this.actualType} is not supported.`;
		}
	}
}

class FileSizeExceededError extends FileUploadError {
	constructor(message = "File size exceeds maximum limit") {
		super(message);
		this.name = "FileSizeExceededError";
	}
}

export function formatFileSize(size: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let formattedSize = size;
	let i = 0;
	while (formattedSize >= 1024 && i < units.length - 1) {
		formattedSize /= 1024;
		i++;
	}
	return `${formattedSize} ${units[i]}`;
}

export function FilePanel({ node, config }: FilePanelProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isValidFile, setIsValidFile] = useState(true);
	const { addFiles: addFilesInternal, removeFile } = useFileNode(node);
	const toasts = useToasts();
	const maxFileSize = config.maxSize ?? defaultMaxSize;
	const panelRef = useRef<HTMLDivElement>(null);

	const validateItems = useCallback(
		(dataTransferItemList: DataTransferItemList) => {
			let isValid = true;
			for (const dataTransferItem of dataTransferItemList) {
				if (!isValid) {
					break;
				}
				if (dataTransferItem.kind !== "file") {
					isValid = false;
					break;
				}
				// Get file extension if possible
				let itemType = dataTransferItem.type;
				const file = dataTransferItem.getAsFile();
				if (!itemType && file) {
					const extension = file.name.split(".").pop()?.toLowerCase();
					if (extension === "md" || extension === "markdown") {
						itemType = "text/markdown";
					}
				}
				isValid = config.accept.some((accept) =>
					new RegExp(accept).test(itemType),
				);
			}
			return isValid;
		},
		[config.accept],
	);

	const assertFiles = useCallback(
		(files: FileList) => {
			for (const file of files) {
				if (file.size > maxFileSize) {
					throw new FileSizeExceededError();
				}

				// Determine MIME type from file extension if needed
				let mimeType = file.type;
				if (!mimeType) {
					const extension = file.name.split(".").pop()?.toLowerCase();
					if (extension === "md" || extension === "markdown") {
						mimeType = "text/markdown";
					}
				}

				const isValid = config.accept.some((accept) =>
					new RegExp(accept).test(mimeType),
				);
				if (!isValid) {
					throw new InvalidFileTypeError(config.accept, mimeType);
				}
			}
		},
		[config, maxFileSize],
	);

	const onDragOver = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragging(true);
			setIsValidFile(validateItems(e.dataTransfer.items));
		},
		[validateItems],
	);

	const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
		setIsValidFile(true);
	}, []);

	const addFiles = useCallback(
		(fileList: FileList) => {
			try {
				assertFiles(fileList);
				addFilesInternal(Array.from(fileList));
			} catch (e) {
				if (e instanceof InvalidFileTypeError) {
					toasts.error(e.message);
				} else if (e instanceof FileSizeExceededError) {
					toasts.error(
						`File size exceeds the limit. Please upload a file smaller than ${formatFileSize(maxFileSize)}.`,
					);
				}
			}
		},
		[addFilesInternal, maxFileSize, assertFiles, toasts],
	);

	const onDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragging(false);
			setIsValidFile(true);
			addFiles(e.dataTransfer.files);
		},
		[addFiles],
	);

	const onFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (!e.target.files) {
				return;
			}
			addFiles(e.target.files);
			e.target.value = "";
		},
		[addFiles],
	);

	const handlePaste = useCallback(
		(e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;

			const imageItems: DataTransferItem[] = [];
			for (const item of items) {
				if (item.type.startsWith("image/")) {
					imageItems.push(item);
				}
			}

			if (imageItems.length === 0) return;

			// Prevent default paste behavior
			e.preventDefault();

			const files: File[] = [];
			for (const item of imageItems) {
				const file = item.getAsFile();
				if (file) {
					files.push(file);
				}
			}

			if (files.length > 0) {
				// Create a DataTransfer object to create a FileList
				const dataTransfer = new DataTransfer();
				for (const file of files) {
					dataTransfer.items.add(file);
				}
				addFiles(dataTransfer.files);
			}
		},
		[addFiles],
	);

	useEffect(() => {
		// Only add paste listener for image file nodes
		if (node.content.category === "image" && panelRef.current) {
			const panelEl = panelRef.current;
			// Focus the panel when it's mounted to enable paste without clicking
			panelEl.focus();
			panelEl.addEventListener("paste", handlePaste);
			return () => {
				panelEl.removeEventListener("paste", handlePaste);
			};
		}
	}, [handlePaste, node.content.category]);

	const { sidemenu } = useFeatureFlag();

	const getContentClasses = () => {
		if (sidemenu) {
			return "px-[16px]";
		}
		return "pl-0 pr-[16px]";
	};

	return (
		<div
			ref={panelRef}
			className="relative z-10 flex flex-col gap-[2px] h-full text-[14px] text-black-300 outline-none"
			tabIndex={-1}
		>
			<div className={getContentClasses()}>
				{node.content.files.length > 0 && (
					<div className="pb-[16px]">
						<h3 className="text-[14px] font-semibold text-white-800 mb-[8px]">
							Added Files
						</h3>
						<div className="flex flex-col gap-[8px]">
							{node.content.files.map((file) => (
								<FileListItem
									key={file.id}
									fileData={file}
									onRemove={removeFile}
								/>
							))}
						</div>
					</div>
				)}
				<div className="py-[16px]">
					<div
						className={clsx(
							"group h-[300px] p-[8px]",
							"border border-black-400 rounded-[8px]",
							"data-[dragging=true]:data-[valid=false]:border-error-900",
						)}
						onDragOver={onDragOver}
						onDragLeave={onDragLeave}
						onDrop={onDrop}
						data-dragging={isDragging}
						data-valid={isValidFile}
					>
						<div
							className={clsx(
								"h-full flex flex-col justify-center items-center gap-[16px] px-[24px] py-[10px]",
								"border border-dotted rounded-[8px] border-transparent",
								"group-data-[dragging=true]:border-black-400",
								"group-data-[dragging=true]:group-data-[valid=false]:border-error-900",
							)}
						>
							{isDragging ? (
								<>
									{isValidFile ? (
										<>
											<FileNodeIcon
												node={node}
												className="size-[30px] text-black-400"
											/>
											<p className="text-center text-white-400">
												Drop to upload your {config.label} files
											</p>
										</>
									) : (
										<>
											<TriangleAlert className="size-[30px] text-error-900" />
											<p className="text-center text-error-900">
												Only {config.label} files are allowed
											</p>
										</>
									)}
								</>
							) : !isValidFile ? (
								<>
									<FileXIcon className="size-[30px] text-error-900" />
									<p className="text-center text-error-900">
										Only {config.label} files are allowed
									</p>
								</>
							) : (
								<div className="flex flex-col gap-[16px] justify-center items-center">
									<ArrowUpFromLineIcon size={38} className="text-black-400" />
									<label
										htmlFor="file"
										className="text-center flex flex-col gap-[16px] text-white-400"
									>
										<p>Drop {config.label} files here to upload.</p>
										{node.content.category === "image" && (
											<p className="text-[12px] text-black-400">
												You can also paste images from clipboard (Ctrl/Cmd + V)
											</p>
										)}
										<div className="flex gap-[8px] justify-center items-center">
											<span>or</span>
											<span className="font-bold text-[14px] underline cursor-pointer">
												Select files
												<input
													accept={"*"}
													multiple
													id="file"
													type="file"
													onChange={onFileChange}
													className="hidden"
												/>
											</span>
										</div>
									</label>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function FileListItem({
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
