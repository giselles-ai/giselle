"use client";

import { Select } from "@giselle-internal/ui/select";
import type { GenerationContextInput } from "@giselles-ai/protocol";
import clsx from "clsx";
import { ArrowUpIcon, Paperclip, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileAttachments } from "../../playground/file-attachments";
import type { StageApp } from "../../playground/types";
import {
	type StageAppSelectionScope,
	useStageAppSelectionStore,
} from "../../stores/stage-app-selection-store";
import { ACCEPTED_FILE_TYPES, useStageInput } from "./use-stage-input";

const DEFAULT_IDLE_NUDGE_DELAY_MS = 8000;
const PLAYGROUND_HAS_VISITED_KEY = "giselle:playground:hasVisited";
const PLAYGROUND_HAS_SHOWN_IDLE_HINT_KEY =
	"giselle:playground:hasShownIdleHint";
const PLAYGROUND_HAS_RUN_ANY_APP_KEY = "giselle:playground:hasRunAnyApp";

export function PlaygroundStageInput({
	apps,
	scope,
	onSubmitAction,
	isRunning,
	interactionTick,
	idleNudgeDelayMs = DEFAULT_IDLE_NUDGE_DELAY_MS,
	renderIdleHint,
	hasRunAnyApp,
}: {
	apps: StageApp[];
	scope: StageAppSelectionScope;
	onSubmitAction: (event: { inputs: GenerationContextInput[] }) => void;
	isRunning: boolean;
	interactionTick?: number;
	idleNudgeDelayMs?: number;
	renderIdleHint?: (props: { isVisible: boolean }) => ReactNode;
	hasRunAnyApp?: boolean;
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

	const firstAppOptionValue = appOptions[0]?.value;

	// Idle nudge: after a short inactivity window, subtly animate the next action.
	// This must be handled in an effect (timer) and should stop on any interaction.
	const [lastInteractionAt, setLastInteractionAt] = useState(() => Date.now());
	const [isIdleNudgeActive, setIsIdleNudgeActive] = useState(false);
	const [isIdleHintVisible, setIsIdleHintVisible] = useState(false);
	const [isFirstVisit, setIsFirstVisit] = useState(false);
	const [hasShownIdleHintEver, setHasShownIdleHintEver] = useState(false);
	const [hasRunAnyAppEver, setHasRunAnyAppEver] = useState(false);

	useEffect(() => {
		try {
			const hasVisited = window.localStorage.getItem(
				PLAYGROUND_HAS_VISITED_KEY,
			);
			setIsFirstVisit(!hasVisited);
			window.localStorage.setItem(PLAYGROUND_HAS_VISITED_KEY, "1");

			const shown = window.localStorage.getItem(
				PLAYGROUND_HAS_SHOWN_IDLE_HINT_KEY,
			);
			setHasShownIdleHintEver(Boolean(shown));

			const ran = window.localStorage.getItem(PLAYGROUND_HAS_RUN_ANY_APP_KEY);
			setHasRunAnyAppEver(Boolean(ran));
		} catch {
			// localStorage might be unavailable (privacy mode). In that case, disable the hint.
			setIsFirstVisit(false);
			setHasShownIdleHintEver(true);
			setHasRunAnyAppEver(true);
		}
	}, []);

	const markInteraction = useCallback(() => {
		setIsIdleNudgeActive(false);
		setLastInteractionAt(Date.now());
	}, []);

	useEffect(() => {
		if (interactionTick === undefined) return;
		markInteraction();
	}, [interactionTick, markInteraction]);

	const shouldShowIdleNudge = useMemo(() => {
		if (isRunning) return false;
		if (hasInput) return false;
		if (hasPendingUploads) return false;
		return true;
	}, [hasInput, hasPendingUploads, isRunning]);

	const shouldAllowIdleHint = useMemo(() => {
		if (!renderIdleHint) return false;
		if (!isFirstVisit) return false;
		if (hasShownIdleHintEver) return false;
		if (hasRunAnyAppEver || Boolean(hasRunAnyApp)) return false;
		return shouldShowIdleNudge;
	}, [
		hasRunAnyApp,
		hasRunAnyAppEver,
		hasShownIdleHintEver,
		isFirstVisit,
		renderIdleHint,
		shouldShowIdleNudge,
	]);

	useEffect(() => {
		if (!shouldShowIdleNudge) {
			setIsIdleNudgeActive(false);
			return;
		}

		const timeout = setTimeout(() => {
			if (Date.now() - lastInteractionAt >= idleNudgeDelayMs) {
				setIsIdleNudgeActive(true);
			}
		}, idleNudgeDelayMs);

		return () => clearTimeout(timeout);
	}, [idleNudgeDelayMs, lastInteractionAt, shouldShowIdleNudge]);

	// Ensure fade-in always transitions by flipping visibility on the next frame.
	// (0 -> 1 opacity transitions can "pop" if the browser doesn't paint the 0 state first.)
	useEffect(() => {
		if (!renderIdleHint) return;
		if (!shouldAllowIdleHint || !isIdleNudgeActive) {
			setIsIdleHintVisible(false);
			return;
		}
		const raf = window.requestAnimationFrame(() => {
			setIsIdleHintVisible(true);
			try {
				window.localStorage.setItem(PLAYGROUND_HAS_SHOWN_IDLE_HINT_KEY, "1");
				setHasShownIdleHintEver(true);
			} catch {
				// ignore
			}
		});
		return () => window.cancelAnimationFrame(raf);
	}, [isIdleNudgeActive, renderIdleHint, shouldAllowIdleHint]);

	const handleInputChangeWithInteraction = useCallback(
		(...args: Parameters<typeof handleInputChange>) => {
			markInteraction();
			return handleInputChange(...args);
		},
		[handleInputChange, markInteraction],
	);

	const handleKeyDownWithInteraction = useCallback(
		(...args: Parameters<typeof handleKeyDown>) => {
			markInteraction();
			return handleKeyDown(...args);
		},
		[handleKeyDown, markInteraction],
	);

	const handleAttachmentButtonClickWithInteraction = useCallback(() => {
		markInteraction();
		handleAttachmentButtonClick();
	}, [handleAttachmentButtonClick, markInteraction]);

	const handleSubmitWithInteraction = useCallback(() => {
		markInteraction();
		handleSubmit();
	}, [handleSubmit, markInteraction]);

	const handleDropWithInteraction = useCallback(
		(...args: Parameters<typeof handleDrop>) => {
			markInteraction();
			return handleDrop(...args);
		},
		[handleDrop, markInteraction],
	);

	const handleRemoveFileWithInteraction = useCallback(
		(...args: Parameters<typeof handleRemoveFile>) => {
			markInteraction();
			return handleRemoveFile(...args);
		},
		[handleRemoveFile, markInteraction],
	);

	return (
		<div className="relative w-full max-w-[640px] min-w-[320px] mx-auto">
			{renderIdleHint ? renderIdleHint({ isVisible: isIdleHintVisible }) : null}
			<section
				aria-label="Message input and dropzone"
				className={clsx(
					"relative rounded-2xl bg-[rgba(131,157,195,0.14)] shadow-[inset_0_1px_4px_rgba(0,0,0,0.22)] pt-4 pb-3 sm:pt-5 sm:pb-4 px-4 transition-colors",
					isDragActive && "ring-1 ring-blue-muted/50",
					isIdleNudgeActive && "ring-1 ring-blue-muted/30",
				)}
				onDragEnter={handleDragEnter}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDropWithInteraction}
			>
				{isDragActive ? (
					<div className="pointer-events-none absolute inset-0 rounded-2xl border border-dashed border-blue-muted/60 bg-blue-muted/10" />
				) : null}
				<div className="relative">
					<textarea
						ref={textareaRef}
						value={inputValue}
						onChange={handleInputChangeWithInteraction}
						onCompositionStart={handleCompositionStart}
						onCompositionEnd={handleCompositionEnd}
						onKeyDown={handleKeyDownWithInteraction}
						placeholder={selectedApp?.description ?? ""}
						rows={1}
						disabled={isRunning}
						className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-blue-muted/50 outline-none disabled:cursor-not-allowed min-h-[2.4em] sm:min-h-[2.75em] pt-0 pb-[0.7em] px-1"
					/>

					<div className="flex items-center justify-between mt-2 sm:mt-3">
						<div className="flex items-center gap-2 flex-1 max-w-[260px]">
							<button
								type="button"
								onClick={handleAttachmentButtonClickWithInteraction}
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
										markInteraction();
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
								onClick={handleSubmitWithInteraction}
								disabled={!canSubmit}
								className={clsx(
									"flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] bg-[color:var(--color-inverse)] disabled:cursor-not-allowed",
									hasInput && !hasPendingUploads ? "opacity-100" : "opacity-40",
									isIdleNudgeActive && "motion-safe:animate-pulse",
								)}
							>
								<ArrowUpIcon className="h-3 w-3 text-[color:var(--color-background)]" />
							</button>
						</div>
					</div>

					<FileAttachments
						files={attachedFiles}
						onRemoveFile={handleRemoveFileWithInteraction}
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
			<div
				className={clsx(
					"mt-1 flex flex-wrap items-center justify-end gap-3 pr-0 text-[11px] text-blue-muted/60",
					isIdleNudgeActive && "motion-safe:animate-pulse",
				)}
			>
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
