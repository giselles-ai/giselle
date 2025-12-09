import type { FileData, UploadedFileData } from "@giselles-ai/protocol";
import { AlertCircle, Check, Loader2, Paperclip, X } from "lucide-react";

interface FileAttachmentsProps {
	files: FileData[];
	onRemoveFile: (fileId: string) => void;
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

export function FileAttachments({ files, onRemoveFile }: FileAttachmentsProps) {
	if (files.length === 0) {
		return null;
	}

	const readyCount = files.filter(isUploadedFile).length;

	return (
		<div className="mt-3 space-y-2" aria-live="polite">
			<div className="flex items-center justify-between text-[11px] text-blue-muted/70 px-1">
				<span>Attachments</span>
				<span>
					{readyCount}/{files.length} ready
				</span>
			</div>
			{files.map((file) => {
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
