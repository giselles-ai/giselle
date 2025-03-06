import type {
	FileData,
	FileNode,
	UploadedFileData,
} from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { ArrowUpFromLineIcon, TrashIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toRelativeTime } from "../../../helper/datetime";
import { PdfFileIcon } from "../../../icons";
import { Tooltip } from "../../../ui/tooltip";
import { useFileNode } from "./use-file-node";

export function FilePanel({ node }: { node: FileNode }) {
	const [isDragging, setIsDragging] = useState(false);
	const { addFiles, removeFile } = useFileNode(node);

	const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const onDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragging(false);
			addFiles(Array.from(e.dataTransfer.files));
		},
		[addFiles],
	);

	const onFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (!e.target.files) {
				return;
			}
			addFiles(Array.from(e.target.files));
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
						)}
						onDragOver={onDragOver}
						onDragLeave={onDragLeave}
						onDrop={onDrop}
						data-dragging={isDragging}
					>
						<div
							className={clsx(
								"h-full flex flex-col justify-center items-center gap-[16px] px-[24px] py-[10px]",
								"border border-dotted rounded-[8px] border-transparent group-data-[dragging=true]:border-black-400",
							)}
						>
							{isDragging ? (
								<>
									<PdfFileIcon className="size-[30px] text-black-400" />
									<p className="text-center text-white-400">
										Drop to upload your files
									</p>
								</>
							) : (
								<div className="flex flex-col gap-[16px] justify-center items-center">
									<ArrowUpFromLineIcon size={38} className="text-black-400" />
									<label
										htmlFor="file"
										className="text-center flex flex-col gap-[16px] text-white-400"
									>
										<p>Drop pdf files here to upload.</p>
										<div className="flex gap-[8px] justify-center items-center">
											<span>or</span>
											<span className="font-bold text-[14px] underline cursor-pointer">
												Select files
												<input
													accept="application/pdf"
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
