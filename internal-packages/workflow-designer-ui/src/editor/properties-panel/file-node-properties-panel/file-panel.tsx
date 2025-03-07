import type {
	FileData,
	FileNode,
	UploadedFileData,
} from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { ArrowUpFromLineIcon, FileXIcon, TrashIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toRelativeTime } from "../../../helper/datetime";
import { TriangleAlert } from "../../../icons";
import { FileNodeIcon } from "../../../icons/node";
import { useToasts } from "../../../ui/toast";
import { Tooltip } from "../../../ui/tooltip";
import { useFileNode } from "./use-file-node";

export type FileTypeConfig = {
	accept: string[];
	label: string;
	maxSize?: number;
};

const defaultMaxSize = 1024 * 1024 * 20;

type FilePanelProps = {
	node: FileNode;
	config: FileTypeConfig;
};

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
		super(`Invalid file type: ${actualType}`);
		this.actualType = actualType;
		this.expectedType = expectedType;
		this.name = "InvalidFileTypeError";
		this.message = `This node supports ${expectedType.join(", ")}, but got ${actualType}. ${this.suggestion()}`;
	}

	suggestion() {
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
				isValid = config.accept.some((accept) =>
					new RegExp(accept).test(dataTransferItem.type),
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

				const isValid = config.accept.some((accept) =>
					new RegExp(accept).test(file.type),
				);
				if (!isValid) {
					throw new InvalidFileTypeError(config.accept, file.type);
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

	return (
		<div className="relative z-10 flex flex-col gap-[2px] h-full text-[14px] text-black-300">
			<div className="p-[16px] divide-y divide-black-50">
				{node.content.files.length > 0 && (
					<div className="pb-[16px] flex flex-col gap-[8px]">
						{node.content.files.map((file) => (
							<FileListItem
								key={file.id}
								fileData={file}
								onRemove={(uploadedFile) => removeFile(uploadedFile)}
							/>
						))}
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
	onRemove: (file: UploadedFileData) => void;
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
			{fileData.status === "uploaded" && (
				<Tooltip text="Remove">
					<button
						type="button"
						className="hidden group-hover:block px-[4px] py-[4px] bg-transparent hover:bg-white-900/10 rounded-[8px] transition-colors mr-[2px] flex-shrink-0"
						onClick={() => onRemove(fileData)}
					>
						<TrashIcon className="w-[24px] h-[24px] stroke-current stroke-[1px] " />
					</button>
				</Tooltip>
			)}
		</div>
	);
}
