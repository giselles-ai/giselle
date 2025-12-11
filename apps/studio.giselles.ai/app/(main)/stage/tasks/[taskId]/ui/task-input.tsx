"use client";

import type { ParameterItem, UploadedFileData } from "@giselles-ai/protocol";
import { Check } from "lucide-react";
import { use } from "react";
import type { TaskInputData } from "./task-input-types";

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

function TaskInputFiles({
	files,
	label,
}: {
	files: UploadedFileData[];
	label?: string;
}) {
	if (files.length === 0) {
		return null;
	}

	return (
		<div className="mt-3 space-y-2" aria-live="polite">
			<div className="flex items-center justify-between px-1 text-[11px] text-blue-muted/70">
				<span>{label || "Attachments"}</span>
				<span>
					{files.length}/{files.length} ready
				</span>
			</div>
			{files.map((file) => (
				<TaskInputItemFile key={file.id} file={file} />
			))}
		</div>
	);
}

function TaskInputItem({ item }: { item: ParameterItem }) {
	switch (item.type) {
		case "files":
			return <TaskInputFiles files={item.value} label={item.name} />;
		case "number":
			return <p>{item.value}</p>;
		case "string":
			return <p>{item.value}</p>;
		default: {
		}
	}
}
export function TaskInput({
	taskInputPromise,
}: {
	taskInputPromise: Promise<TaskInputData> | undefined;
}) {
	if (taskInputPromise === undefined) {
		return (
			<div className="rounded-[10px] border border-blue-muted/40 bg-blue-muted/7 px-3 py-2 text-[13px] text-text/80">
				<p>No task input</p>
			</div>
		);
	}
	const taskInput = use(taskInputPromise);
	return (
		<div className="rounded-[10px] border border-blue-muted/40 bg-blue-muted/7 px-3 py-2 text-[13px] text-text/80">
			{taskInput == null ? (
				<p>No task input</p>
			) : (
				taskInput.items.map((item) => (
					<TaskInputItem key={item.name} item={item} />
				))
			)}
		</div>
	);
}
