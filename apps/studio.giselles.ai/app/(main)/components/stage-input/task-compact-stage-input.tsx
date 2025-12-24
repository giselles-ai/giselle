"use client";

import { Select } from "@giselle-internal/ui/select";
import type { GenerationContextInput } from "@giselles-ai/protocol";
import { ArrowUpIcon, Paperclip, X } from "lucide-react";
import { FileAttachments } from "../../playground/file-attachments";
import type { StageApp } from "../../playground/types";
import {
	type StageAppSelectionScope,
	useStageAppSelectionStore,
} from "../../stores/stage-app-selection-store";
import { ACCEPTED_FILE_TYPES, useStageInput } from "./use-stage-input";

export function TaskCompactStageInput({
	apps,
	scope,
	preferredAppId,
	onSubmitAction,
	isRunning,
}: {
	apps: StageApp[];
	scope: StageAppSelectionScope;
	preferredAppId?: string;
	onSubmitAction: (event: { inputs: GenerationContextInput[] }) => void;
	isRunning: boolean;
}) {
	const setSelectedAppId = useStageAppSelectionStore(
		(state) => state.setSelectedAppId,
	);

	const {
		basePath,
		appOptions,
		textareaRef,
		fileInputRef,
		inputValue,
		isDragActive,
		attachedFiles,
		localPreviews,
		fileRestrictionError,
		canSubmit,
		hasInput,
		hasPendingUploads,
		handleInputChange,
		handleCompositionStart,
		handleCompositionEnd,
		handleKeyDown,
		handleDragEnter,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleFileInputChange,
		handleAttachmentButtonClick,
		handleRemoveFile,
		handleImageLoad,
		handleDismissFileRestrictionError,
		handleSubmit,
		selectedApp,
	} = useStageInput({
		scope,
		apps,
		preferredAppId,
		onSubmitAction,
		isRunning,
	});

	const isAttachmentDisabled = isRunning || handleAttachmentButtonClick == null;
	const isSelectDisabled = isRunning;
	const isSubmitReady = hasInput && !hasPendingUploads;

	return (
		<div className="relative w-full max-w-[640px] min-w-[320px] mx-auto">
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-text-muted text-[13px] font-semibold">
					Ask something else
				</h2>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleAttachmentButtonClick}
						disabled={isAttachmentDisabled}
						className="group flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[4px] transition-colors hover:bg-white/5 disabled:hover:bg-transparent"
						aria-label="Attach files"
					>
						<Paperclip className="h-3.5 w-3.5 text-text-muted/80 transition-colors group-hover:text-white group-disabled:text-text-muted/70" />
					</button>
					<div className="w-[200px]">
						<Select
							options={appOptions}
							placeholder="Select an app..."
							value={selectedApp?.id}
							widthClassName="w-full"
							onValueChange={(appId) => {
								setSelectedAppId(scope, appId);
							}}
							disabled={isSelectDisabled}
							side="top"
							triggerClassName="border border-border !bg-[rgba(131,157,195,0.1)] hover:!bg-[rgba(131,157,195,0.18)] !px-2 !h-7 !rounded-[6px] text-[12px] [&_svg]:opacity-70"
						/>
					</div>
				</div>
			</div>
			<section
				aria-label="Request new task input and dropzone"
				className={`relative rounded-xl bg-[rgba(131,157,195,0.14)] shadow-[inset_0_1px_4px_rgba(0,0,0,0.22)] pt-3 pb-2 px-4 transition-colors ${
					isDragActive ? "ring-1 ring-blue-muted/50" : ""
				}`}
				onDragEnter={handleDragEnter}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				{isDragActive ? (
					<div className="pointer-events-none absolute inset-0 rounded-xl border border-dashed border-blue-muted/60 bg-blue-muted/10" />
				) : null}
				<div className="relative">
					<div className="flex items-center gap-2">
						<textarea
							ref={textareaRef}
							value={inputValue}
							onChange={handleInputChange}
							onCompositionStart={handleCompositionStart}
							onCompositionEnd={handleCompositionEnd}
							onKeyDown={handleKeyDown}
							placeholder="Ask anything—powered by Giselle docs"
							rows={1}
							disabled={isRunning}
							className="flex-1 resize-none bg-transparent text-[14px] text-foreground placeholder:text-blue-muted/50 outline-none disabled:cursor-not-allowed min-h-[1.9em] pt-0 pb-[0.5em] px-1"
						/>
						<button
							type="button"
							onClick={handleSubmit}
							disabled={!canSubmit}
							className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-inverse)] disabled:cursor-not-allowed ${
								isSubmitReady ? "opacity-100" : "opacity-40"
							}`}
						>
							<ArrowUpIcon className="h-2.5 w-2.5 text-[color:var(--color-background)]" />
						</button>
					</div>

					<FileAttachments
						files={attachedFiles}
						onRemoveFile={handleRemoveFile}
						workspaceId={selectedApp?.workspaceId}
						basePath={basePath}
						localPreviews={localPreviews}
						onImageLoad={handleImageLoad}
					/>

					{fileRestrictionError ? (
						<div
							className="mt-3 rounded-xl border border-red-400/50 bg-red-500/10 px-3 py-2.5 text-left text-red-100"
							role="alert"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex flex-col gap-0.5">
									<p className="text-[13px] font-medium">
										{fileRestrictionError.rejectedFileNames.length === 1
											? `${fileRestrictionError.rejectedFileNames[0]} — Unsupported file type`
											: "Some files — Unsupported file type"}
									</p>
									<p className="text-[11px] text-red-200/80">
										Only PDF and image files can be uploaded.
									</p>
								</div>
								<button
									type="button"
									onClick={handleDismissFileRestrictionError}
									className="text-red-200/80 transition-colors hover:text-red-100"
									aria-label="Dismiss file type error"
								>
									<X className="h-3.5 w-3.5" />
								</button>
							</div>
						</div>
					) : null}

					<input
						ref={fileInputRef}
						type="file"
						className="hidden"
						multiple
						accept={ACCEPTED_FILE_TYPES}
						onChange={handleFileInputChange}
					/>
				</div>
			</section>
		</div>
	);
}
