import type {
	FileData,
	UploadedFileData,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { AlertCircle, Check, Loader2, Paperclip, X } from "lucide-react";

interface FileAttachmentsProps {
	files: FileData[];
	onRemoveFile: (fileId: string) => void;
	workspaceId?: WorkspaceId;
	basePath?: string;
	localPreviews?: Map<string, string>;
	onImageLoad?: (fileId: string) => void;
}

function formatFileSize(bytes: number) {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		return "0 B";
	}
	const units = ["B", "KB", "MB", "GB", "TB"];
	const exponent = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1,
	);
	const value = bytes / 1024 ** exponent;
	const decimals = value >= 10 || exponent === 0 ? 0 : 1;
	return `${value.toFixed(decimals)} ${units[exponent]}`;
}

function isUploadedFile(file: FileData): file is UploadedFileData {
	return file.status === "uploaded";
}

function getFileStatusLabel(file: FileData) {
	switch (file.status) {
		case "uploading":
			return "Uploading…";
		case "uploaded":
			return "Ready";
		case "failed":
			return "Upload failed";
		default:
			return file.status;
	}
}

function isImageFile(file: FileData): boolean {
	if (!file.type) return false;
	return file.type.startsWith("image/");
}

function getFileExtension(fileName: string): string {
	const lastDot = fileName.lastIndexOf(".");
	if (lastDot === -1) return "";
	return fileName.slice(lastDot).toLowerCase();
}

function getFileTypeBadge(file: FileData): string | null {
	const ext = getFileExtension(file.name);
	const typeMap: Record<string, string> = {
		".pdf": "PDF",
		".xlsx": "XLSX",
		".xls": "XLS",
		".docx": "DOCX",
		".doc": "DOC",
		".txt": "TXT",
		".md": "MD",
		".csv": "CSV",
	};
	return typeMap[ext] || null;
}

function getFileUrl(
	file: UploadedFileData,
	workspaceId: WorkspaceId,
	basePath: string,
): string {
	// Generate file path for stage type
	const path = `workspaces/${workspaceId}/files/${file.id}/${file.id}`;
	// Ensure basePath ends with / and path doesn't start with /
	const normalizedBasePath = basePath.endsWith("/") ? basePath : `${basePath}/`;
	const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
	return `${normalizedBasePath}${normalizedPath}`;
}

export function FileAttachments({
	files,
	onRemoveFile,
	workspaceId,
	basePath,
	localPreviews,
	onImageLoad,
}: FileAttachmentsProps) {
	if (files.length === 0) {
		return null;
	}

	const readyCount = files.filter(isUploadedFile).length;
	const imageFiles = files.filter(isImageFile);
	const documentFiles = files.filter(
		(file) => !isImageFile(file) && getFileTypeBadge(file) !== null,
	);
	const otherFiles = files.filter(
		(file) => !isImageFile(file) && getFileTypeBadge(file) === null,
	);

	return (
		<div className="mt-3 space-y-2" aria-live="polite">
			<div className="flex items-center justify-between text-[11px] text-blue-muted/70 px-1">
				<span>Attachments</span>
				<span>
					{readyCount}/{files.length} ready
				</span>
			</div>

			{/* Image previews - horizontal scroll */}
			{imageFiles.length > 0 && (
				<div className="flex gap-2 overflow-x-auto pb-1">
					{imageFiles.map((file) => {
						const isUploaded = isUploadedFile(file);
						const localPreview = localPreviews?.get(file.id);
						let imageUrl: string | null = null;

						if (isUploaded && workspaceId && basePath) {
							imageUrl = getFileUrl(file, workspaceId, basePath);
						} else if (localPreview) {
							imageUrl = localPreview;
						}

						return (
							<div
								key={file.id}
								className="relative group shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/5 w-[60px] h-[60px]"
							>
								{imageUrl ? (
									<img
										src={imageUrl}
										alt={file.name}
										className="object-cover w-full h-full"
										onError={(e) => {
											// If server URL fails, fallback to local preview
											if (
												isUploaded &&
												localPreview &&
												e.currentTarget.src !== localPreview
											) {
												e.currentTarget.src = localPreview;
											}
										}}
										onLoad={() => {
											// Notify parent that server image loaded successfully
											// Parent will clean up local preview URL
											if (isUploaded && onImageLoad) {
												onImageLoad(file.id);
											}
										}}
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-blue-muted/50">
										{file.status === "uploading" ? (
											<Loader2 className="h-6 w-6 animate-spin" />
										) : (
											<Paperclip className="h-6 w-6" />
										)}
									</div>
								)}
								<button
									type="button"
									onClick={() => {
										onRemoveFile(file.id);
									}}
									className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
									aria-label={`Remove ${file.name}`}
								>
									<X className="h-2.5 w-2.5" />
								</button>
							</div>
						);
					})}
				</div>
			)}

			{/* Document file previews - horizontal scroll */}
			{documentFiles.length > 0 && (
				<div className="flex gap-2 overflow-x-auto pb-1">
					{documentFiles.map((file) => {
						const fileTypeBadge = getFileTypeBadge(file);

						return (
							<div
								key={file.id}
								className="relative group shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/5 w-[60px] h-[60px] flex flex-col p-1.5"
							>
								{file.status === "uploading" ? (
									<div className="w-full h-full flex items-center justify-center">
										<Loader2 className="h-4 w-4 animate-spin text-blue-muted" />
									</div>
								) : file.status === "failed" ? (
									<div className="w-full h-full flex items-center justify-center">
										<AlertCircle className="h-4 w-4 text-red-400" />
									</div>
								) : (
									<>
										<div className="flex-1 flex items-start justify-center min-h-0">
											<p className="text-[8px] text-white leading-tight line-clamp-2 text-center break-words">
												{file.name}
											</p>
										</div>
										{fileTypeBadge && (
											<div className="mt-auto flex items-center justify-center">
												<div className="px-1 py-0.5 rounded bg-white/10 border border-white/10">
													<span className="text-[7px] text-white font-medium">
														{fileTypeBadge}
													</span>
												</div>
											</div>
										)}
									</>
								)}
								<button
									type="button"
									onClick={() => {
										onRemoveFile(file.id);
									}}
									className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
									aria-label={`Remove ${file.name}`}
								>
									<X className="h-2.5 w-2.5" />
								</button>
							</div>
						);
					})}
				</div>
			)}

			{/* Other files */}
			{otherFiles.map((file) => {
				const statusLabel = getFileStatusLabel(file);

				return (
					<div
						key={file.id}
						className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-left"
					>
						<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
							{file.status === "uploading" ? (
								<Loader2 className="h-4 w-4 animate-spin text-blue-muted" />
							) : file.status === "uploaded" ? (
								<Check className="h-4 w-4 text-emerald-300" />
							) : file.status === "failed" ? (
								<AlertCircle className="h-4 w-4 text-red-400" />
							) : (
								<Paperclip className="h-4 w-4 text-blue-muted" />
							)}
						</div>
						<div className="flex flex-1 flex-col gap-1 min-w-0">
							<div className="flex items-center justify-between gap-2">
								<p className="truncate text-[13px] text-white">{file.name}</p>
								<button
									type="button"
									onClick={() => {
										onRemoveFile(file.id);
									}}
									className="text-text-muted hover:text-white transition-colors"
									aria-label={`Remove ${file.name}`}
								>
									<X className="h-3.5 w-3.5" />
								</button>
							</div>
							<p className="text-[11px] text-blue-muted/70">
								{formatFileSize(file.size)} · {statusLabel}
							</p>
							{file.status === "failed" && file.errorMessage ? (
								<p className="text-[11px] text-red-400">{file.errorMessage}</p>
							) : null}
						</div>
					</div>
				);
			})}
		</div>
	);
}
