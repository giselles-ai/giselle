import { useToasts } from "@giselle-internal/ui/toast";
import type { FileData } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { ArrowUpFromLineIcon, FileXIcon, TrashIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TriangleAlert } from "../../../icons";
import { FileNodeIcon } from "../../../icons/node";
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

function formatFileSize(size: number): string {
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
		(e: React.DragEvent<HTMLButtonElement>) => {
			e.preventDefault();
			setIsDragging(true);
			setIsValidFile(validateItems(e.dataTransfer.items));
		},
		[validateItems],
	);

	const onDragLeave = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
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
				// Create a FileList from File[] to use validation path
				const dataTransfer = new DataTransfer();
				for (const file of files) {
					dataTransfer.items.add(file);
				}
				addFiles(dataTransfer.files); // Use validation path
			}
		},
		[addFiles],
	);

	useEffect(() => {
		// Only add paste listener for image file nodes
		if (node.content.category === "image" && panelRef.current) {
			const panelEl = panelRef.current;
			panelEl.addEventListener("paste", handlePaste);
			return () => {
				panelEl.removeEventListener("paste", handlePaste);
			};
		}
	}, [handlePaste, node.content.category]);

	const onDrop = useCallback(
		(e: React.DragEvent<HTMLButtonElement>) => {
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

	return (
		<div
			ref={panelRef}
			className="relative z-10 flex flex-col gap-[2px] h-full text-[14px] text-black-300 outline-none"
			tabIndex={-1}
		>
			<div>
				<div>
					<button
						type="button"
						className={clsx(
							"group h-[300px] p-[8px] w-full",
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
								"h-full flex flex-col justify-center items-center gap-[16px] px-[24px] py-[16px]",
								"border border-dotted rounded-[8px] border-transparent",
								"group-data-[dragging=true]:border-black-400",
								"group-data-[dragging=true]:group-data-[valid=false]:border-error-900",
							)}
						>
							{isDragging ? (
								isValidFile ? (
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
								)
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
												Click here and paste images from clipboard (Ctrl/Cmd +
												V)
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
					</button>
				</div>
				{node.content.files.length > 0 && (
					<div className="mt-[24px]">
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
		<div className="flex items-center justify-between hover:bg-black-50/50 transition-colors rounded-[8px] group">
			<div className="flex items-center gap-[12px] flex-1 min-w-0">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					className="text-white-400 shrink-0"
					role="img"
					aria-label="File icon"
				>
					<path
						d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<polyline
						points="14,2 14,8 20,8"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				<div className="min-w-0 flex-1">
					<p className="text-[14px] text-white-800 truncate font-medium">
						{fileData.name}
					</p>
					{fileData.status === "uploading" && (
						<p className="text-[12px] text-black-400">Uploading...</p>
					)}
					{fileData.status === "failed" && (
						<p className="text-[12px] text-error-900">Upload failed</p>
					)}
				</div>
			</div>

			<button
				type="button"
				onClick={() => onRemove(fileData)}
				className="w-[32px] h-[32px] rounded-[6px] flex items-center justify-center hover:bg-black-100 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
			>
				<TrashIcon size={16} className="text-black-400 hover:text-white-800" />
			</button>
		</div>
	);
}
