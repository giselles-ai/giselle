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

export function PlaygroundStageInput({
	selectedApp,
	apps,
	scope,
	onSubmitAction,
	isRunning,
}: {
	selectedApp?: StageApp;
	apps: StageApp[];
	scope: StageAppSelectionScope;
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
	} = useStageInput({
		selectedApp,
		apps,
		onSubmitAction,
		isRunning,
	});

	const firstAppOptionValue = appOptions[0]?.value;

	return (
		<div className="relative w-full max-w-[640px] min-w-[320px] mx-auto">
			<section
				aria-label="Message input and dropzone"
				className={`relative rounded-2xl bg-[rgba(131,157,195,0.14)] shadow-[inset_0_1px_4px_rgba(0,0,0,0.22)] pt-4 pb-3 sm:pt-5 sm:pb-4 px-4 transition-colors ${
					isDragActive ? "ring-1 ring-blue-muted/50" : ""
				}`}
				onDragEnter={handleDragEnter}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				{isDragActive ? (
					<div className="pointer-events-none absolute inset-0 rounded-2xl border border-dashed border-blue-muted/60 bg-blue-muted/10" />
				) : null}
				<div className="relative">
					<textarea
						ref={textareaRef}
						value={inputValue}
						onChange={handleInputChange}
						onCompositionStart={handleCompositionStart}
						onCompositionEnd={handleCompositionEnd}
						onKeyDown={handleKeyDown}
						placeholder={selectedApp?.description ?? ""}
						rows={1}
						disabled={isRunning}
						className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-blue-muted/50 outline-none disabled:cursor-not-allowed min-h-[2.4em] sm:min-h-[2.75em] pt-0 pb-[0.7em] px-1"
					/>

					<div className="flex items-center justify-between mt-2 sm:mt-3">
						<div className="flex items-center gap-2 flex-1 max-w-[260px]">
							<button
								type="button"
								onClick={handleAttachmentButtonClick}
								className="group flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] transition-colors hover:bg-white/5"
								aria-label="Attach files"
							>
								<Paperclip className="h-4 w-4 text-text-muted transition-colors group-hover:text-white" />
							</button>
							<div className="flex-1">
								<Select
									options={appOptions}
									placeholder="Select an app..."
									value={selectedApp?.id ?? firstAppOptionValue}
									onValueChange={(appId) => {
										setSelectedAppId(scope, appId);
									}}
									widthClassName="w-full"
									triggerClassName="border-none !bg-[rgba(131,157,195,0.1)] hover:!bg-[rgba(131,157,195,0.18)] !px-2 !h-8 sm:!h-9 !rounded-[7px] sm:!rounded-[9px] text-[13px] [&_svg]:opacity-70"
								/>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={handleSubmit}
								disabled={!canSubmit}
								className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] bg-[color:var(--color-inverse)] disabled:cursor-not-allowed ${
									hasInput && !hasPendingUploads ? "opacity-100" : "opacity-40"
								}`}
							>
								<ArrowUpIcon className="h-3 w-3 text-[color:var(--color-background)]" />
							</button>
						</div>
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
			<div className="mt-1 flex flex-wrap items-center justify-end gap-3 pr-0 text-[11px] text-blue-muted/60">
				<div className="flex items-center gap-[6px]">
					<div className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border border-blue-muted/40 bg-blue-muted/10">
						<span className="text-[10px] leading-none tracking-[0.08em]">
							↵
						</span>
					</div>
					<span className="leading-none">to send</span>
				</div>
			</div>
		</div>
	);
}
