"use client";

import type { GenerationContextInput } from "@giselles-ai/protocol";
import { X } from "lucide-react";
import { FileAttachments } from "../../playground/file-attachments";
import type { StageApp } from "../../playground/types";
import {
	type StageAppSelectionScope,
	useStageAppSelectionStore,
} from "../../stores/stage-app-selection-store";
import { InputAreaHeaderControls } from "../../tasks/[taskId]/ui/input-area-header-controls";
import { InputAreaTextRow } from "../../tasks/[taskId]/ui/input-area-placeholder";
import { ACCEPTED_FILE_TYPES, useStageInput } from "./use-stage-input";

export function TaskCompactStageInput({
	apps,
	scope,
	onSubmitAction,
	isRunning,
}: {
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
		selectedApp,
	} = useStageInput({
		scope,
		apps,
		onSubmitAction,
		isRunning,
	});

	return (
		<div className="relative w-full max-w-[640px] min-w-[320px] mx-auto">
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-text-muted text-[13px] font-semibold">
					Request new tasks in a new session
				</h2>
				<InputAreaHeaderControls
					options={appOptions}
					value={selectedApp?.id}
					onValueChange={(appId) => {
						setSelectedAppId(scope, appId);
					}}
					onAttachmentButtonClick={handleAttachmentButtonClick}
					isDisabled={isRunning}
				/>
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
					<InputAreaTextRow
						textareaRef={textareaRef}
						value={inputValue}
						onChange={handleInputChange}
						onCompositionStart={handleCompositionStart}
						onCompositionEnd={handleCompositionEnd}
						onKeyDown={handleKeyDown}
						placeholder="Ask anything—powered by Giselle docs"
						isDisabled={isRunning}
						canSubmit={canSubmit}
						isSubmitReady={hasInput && !hasPendingUploads}
						onSubmit={handleSubmit}
					/>

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
