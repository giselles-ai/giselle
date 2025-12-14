import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type {
	ParameterItem,
	ParametersInput,
	Task,
	UploadedFileData,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { Check, FilePenLineIcon } from "lucide-react";
import Link from "next/link";

function formatFileSize(bytes?: number) {
	const safeBytes = Number.isFinite(bytes) ? (bytes as number) : 0;
	if (safeBytes <= 0) {
		return "0 B";
	}
	const units = ["B", "KB", "MB", "GB", "TB"];
	const exponent = Math.min(
		Math.floor(Math.log(safeBytes) / Math.log(1024)),
		units.length - 1,
	);
	const value = safeBytes / 1024 ** exponent;
	const decimals = value >= 10 || exponent === 0 ? 0 : 1;
	return `${value.toFixed(decimals)} ${units[exponent]}`;
}

function TaskInputItemFile({ file }: { file: UploadedFileData }) {
	const sizeLabel = formatFileSize(file.size);

	return (
		<div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-left">
			<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
				<Check className="h-4 w-4 text-emerald-300" aria-hidden />
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<p className="truncate text-[13px] text-white">{file.name}</p>
				<p className="text-[11px] text-blue-muted/70">{sizeLabel} · Ready</p>
			</div>
		</div>
	);
}

function TaskInputItem({ item }: { item: ParameterItem }) {
	switch (item.type) {
		case "files":
			if (item.value.length === 0) {
				return null;
			}
			return (
				<div className="mt-3 space-y-2" aria-live="polite">
					<div className="flex items-center justify-between px-1 text-[11px] text-blue-muted/70">
						<span>{item.name || "Attachments"}</span>
						<span>
							{item.value.length}/{item.value.length} ready
						</span>
					</div>
					{item.value.map((file) => (
						<TaskInputItemFile key={file.id} file={file} />
					))}
				</div>
			);
		case "number":
			return <p>{item.value}</p>;
		case "string":
			return <p>{item.value}</p>;
		default: {
		}
	}
}

interface TaskHeaderProps {
	status: Task["status"];
	title: string;
	description: string;
	workspaceId: WorkspaceId;
	input: ParametersInput | null;
}

export function TaskHeader({
	status,
	title,
	description,
	workspaceId,
	input,
}: TaskHeaderProps) {
	return (
		<div className="w-full pb-3  bg-[color:var(--color-background)]">
			{/* Top gradient separator to soften the edge against the header */}
			<div className="h-4 bg-gradient-to-b from-[color:var(--color-background)] to-transparent pointer-events-none" />
			<div className="mx-auto pt-2">
				{/* App Summary Section */}
				<div>
					{/* Task Status */}
					<div className="mb-2">
						{status === "created" ? (
							<StatusBadge status="success">Completed</StatusBadge>
						) : status === "inProgress" ? (
							<StatusBadge status="info">In Progress</StatusBadge>
						) : status === "completed" ? (
							<StatusBadge status="success">Completed</StatusBadge>
						) : status === "failed" ? (
							<StatusBadge status="error">Failed</StatusBadge>
						) : (
							<StatusBadge status="ignored">Cancelled</StatusBadge>
						)}
					</div>
					{/* Title */}
					{(status === "completed" || status === "failed") && (
						<div className="flex items-center gap-3 mb-1">
							<h3 className="text-[20px] font-normal text-inverse">{title}</h3>
							<Link
								href={`/workspaces/${workspaceId}`}
								className="inline-block motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-left-2 motion-safe:duration-500 motion-safe:ease-out motion-reduce:animate-none"
								target="_blank"
								rel="noreferrer"
							>
								<div className="group [&>div]:rounded-lg [&>div>div]:rounded-md [&>div>div]:text-[hsl(192,73%,84%)] [&>div>div]:border-[hsl(192,73%,84%)] [&>div>div]:transition-colors [&>div>div]:cursor-pointer hover:[&>div>div]:bg-[hsl(192,73%,84%)] hover:[&>div>div]:text-[hsl(192,73%,20%)]">
									<StatusBadge
										status="warning"
										variant="default"
										leftIcon={
											<FilePenLineIcon className="stroke-[hsl(192,73%,84%)] stroke-[1.5] transition-colors group-hover:stroke-[hsl(192,73%,20%)]" />
										}
									>
										Open in Studio
									</StatusBadge>
								</div>
							</Link>
						</div>
					)}
					{/* App summary heading + text (2-column layout to reduce height) */}
					{description.length > 0 && (
						<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3 w-full">
							<span className="text-text-muted text-[13px] font-semibold shrink-0">
								App summary:
							</span>
							<p className="text-[14px] font-normal text-inverse leading-relaxed">
								{description}
							</p>
						</div>
					)}
				</div>

				{/* Task input preview */}
				<div className="mt-3">
					<div className="rounded-[10px] border border-blue-muted/40 bg-blue-muted/7 px-3 py-2 text-[13px] text-text/80">
						{input == null ? (
							<p>No task input</p>
						) : (
							input.items.map((item) => (
								<TaskInputItem key={item.name} item={item} />
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
