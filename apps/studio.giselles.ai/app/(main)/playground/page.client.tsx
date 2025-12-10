"use client";

import { AppIcon } from "@giselle-internal/ui/app-icon";
import { Select, type SelectOption } from "@giselle-internal/ui/select";
import { isIconName } from "@giselle-internal/ui/utils";
import { useToast } from "@giselles-ai/contexts/toast";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import {
	createFailedFileData,
	createUploadedFileData,
	createUploadingFileData,
	type FileData,
	type GenerationContextInput,
	type TaskId,
} from "@giselles-ai/protocol";
import { APICallError, useGiselle } from "@giselles-ai/react";
import { ArrowUpIcon, Paperclip, Search, Sparkles } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { LLMProviderIcon } from "@/app/(main)/workspaces/components/llm-provider-icon";
import type { LoaderData } from "./data-loader";
import { FileAttachments } from "./file-attachments";
import type { StageApp } from "./types";

type AppListCardBadgeType =
	| "sample"
	| "your-team"
	| "other-team"
	| "official"
	| "ambassador";

const APP_LIST_BADGE_CONFIG: Record<
	AppListCardBadgeType,
	{
		label: string;
	}
> = {
	sample: {
		label: "Sample app",
	},
	"your-team": {
		label: "Your team app",
	},
	"other-team": {
		label: "Other team app",
	},
	official: {
		label: "Official app",
	},
	ambassador: {
		label: "Ambassador app",
	},
};

interface AppListCardProps {
	title: string;
	description: string;
	badgeType: AppListCardBadgeType;
	iconName?: string;
	providers?: string[];
	icon?: ReactNode;
	creatorName?: string | null;
	isSelected?: boolean;
	onClick?: () => void;
}

function AppListCard({
	title,
	description,
	badgeType,
	iconName,
	providers,
	icon,
	creatorName,
	isSelected = false,
	onClick,
}: AppListCardProps) {
	const { label } = APP_LIST_BADGE_CONFIG[badgeType];
	const visibleProviders = providers?.slice(0, 3) ?? [];
	const remainingProvidersCount =
		(providers?.length ?? 0) - visibleProviders.length;
	const fallbackInitial = title.trim().charAt(0).toUpperCase() || "A";

	return (
		<button
			type="button"
			className="relative rounded-[10px] sm:rounded-xl border-[0.5px] border-blue-muted/40 bg-transparent px-4 py-3 flex flex-col gap-2 text-left transition-all duration-150 ease-out hover:bg-white/5"
			style={
				isSelected
					? {
							borderColor: "rgba(131,157,195,0.32)",
							boxShadow: "0 0 0 1px rgba(131,157,195,0.18)",
							backgroundColor: "rgba(131,157,195,0.06)",
						}
					: undefined
			}
			onClick={onClick}
		>
			{badgeType !== "your-team" ? (
				<span
					className="pointer-events-none absolute right-4 top-0 -translate-y-[6px] shrink-0 rounded-full px-[7px] py-[3px] text-[10px] sm:px-2 sm:py-[2px] sm:text-[11px] text-text/80"
					style={
						isSelected
							? {
									// Selected state: slightly darker tone around 505D7B
									backgroundColor: "rgba(80,93,123,1)",
								}
							: {
									// Unselected state: darker tone to reduce emphasis
									backgroundColor: "rgba(45,54,76,1)",
								}
					}
				>
					{label}
				</span>
			) : null}
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-full bg-[rgba(21,25,33,0.7)] flex items-center justify-center shrink-0">
					{icon ? (
						icon
					) : iconName && isIconName(iconName) ? (
						<DynamicIcon
							name={iconName as IconName}
							className="h-5 w-5 text-text-muted"
						/>
					) : (
						<span className="text-text-muted text-sm font-semibold">
							{fallbackInitial}
						</span>
					)}
				</div>
				<div className="flex items-center gap-2 min-w-0">
					<span className="font-medium text-[14px] truncate text-[color:var(--color-text-nav-active)]">
						{title}
					</span>
				</div>
			</div>
			{description.length > 0 ? (
				<span className="text-text-muted/70 text-[12px] leading-relaxed line-clamp-2">
					{description}
				</span>
			) : (
				<span className="text-text-muted/70 text-[12px] leading-relaxed invisible">
					placeholder
				</span>
			)}
			<div className="flex min-h-[28px] flex-col gap-0.5 mt-1">
				<div className="flex items-center gap-1">
					{visibleProviders.map((provider) => (
						<div
							key={provider}
							className="flex h-5 w-5 items-center justify-center rounded bg-white/5"
						>
							<LLMProviderIcon
								provider={provider}
								className="h-3 w-3 opacity-40"
							/>
						</div>
					))}
					{remainingProvidersCount > 0 ? (
						<span className="text-text/60 text-[11px]">
							+{remainingProvidersCount}
						</span>
					) : null}
					{(!providers || providers.length === 0) && (
						<span className="text-text/60 text-[11px] invisible">
							placeholder
						</span>
					)}
				</div>
				<span className="text-[11px] text-text-muted/70 py-[1px]">
					{creatorName ? `by ${creatorName}` : ""}
				</span>
			</div>
		</button>
	);
}

function AppCard({
	app,
	onSelect,
	isSelected = false,
}: {
	app: StageApp;
	onSelect?: () => void;
	isSelected?: boolean;
}) {
	const badgeType: AppListCardBadgeType = app.isMine
		? "your-team"
		: "other-team";
	const creatorName = app.creator?.displayName;

	return (
		<AppListCard
			title={app.name}
			description={app.description}
			badgeType={badgeType}
			iconName={app.iconName}
			providers={app.llmProviders}
			creatorName={creatorName}
			isSelected={isSelected}
			onClick={onSelect}
		/>
	);
}

interface StageTopCardProps {
	runningApp?: StageApp;
	runStatus: "idle" | "running" | "completed";
}

function StageTopCard({
	runningApp: _runningApp,
	runStatus: _runStatus,
}: StageTopCardProps) {
	return (
		<div className="relative flex w-full max-w-[960px] min-w-[320px] mx-auto flex-col overflow-hidden">
			<div className="w-full flex justify-center items-center pt-1 pb-1 sm:pt-2 sm:pb-2">
				<div className="flex flex-col items-center relative z-10">
					<p className="font-thin text-[36px] font-sans text-blue-muted/70 text-center">
						What's the task?
						<span className="block sm:inline"> Your agent's on it.</span>
					</p>
				</div>
			</div>
		</div>
	);
}

function getUploadErrorMessage(error: unknown) {
	if (APICallError.isInstance(error)) {
		if (error.statusCode === 413) {
			return "File size is too large.";
		}
		return error.message || "Upload failed";
	}
	if (error instanceof Error) {
		return error.message || "Upload failed";
	}
	return "Upload failed";
}

// Chat-style input area for running apps
function ChatInputArea({
	selectedApp,
	apps,
	onAppSelect,
	onSubmit,
	isRunning,
}: {
	selectedApp?: StageApp;
	apps: StageApp[];
	onAppSelect: (appId: string) => void;
	onSubmit: (event: { inputs: GenerationContextInput[] }) => void;
	isRunning: boolean;
}) {
	const client = useGiselle();
	const { addToast } = useToast();
	const [inputValue, setInputValue] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const dragCounterRef = useRef(0);
	const [isDragActive, setIsDragActive] = useState(false);
	const [attachedFiles, setAttachedFiles] = useState<FileData[]>([]);
	const attachmentsRef = useRef<FileData[]>([]);
	const workspaceIdRef = useRef<StageApp["workspaceId"] | undefined>(
		selectedApp?.workspaceId,
	);

	const appOptions: SelectOption[] = apps.map((app) => ({
		value: app.id,
		label: app.name,
		icon: <DynamicIcon name={app.iconName} className="h-4 w-4" />,
	}));

	useEffect(() => {
		attachmentsRef.current = attachedFiles;
	}, [attachedFiles]);

	useEffect(() => {
		if (workspaceIdRef.current !== selectedApp?.workspaceId) {
			workspaceIdRef.current = selectedApp?.workspaceId;
			setAttachedFiles([]);
		}
	}, [selectedApp?.workspaceId]);

	const resizeTextarea = () => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputValue(e.target.value);
		// Auto-resize textarea on input change
		resizeTextarea();
	};

	const containsFiles = useCallback(
		(event: React.DragEvent<HTMLElement>) =>
			Array.from(event.dataTransfer?.items ?? []).some(
				(item) => item.kind === "file",
			),
		[],
	);

	const handleDragEnter = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!containsFiles(event)) {
				return;
			}
			event.preventDefault();
			dragCounterRef.current += 1;
			setIsDragActive(true);
		},
		[containsFiles],
	);

	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!containsFiles(event)) {
				return;
			}
			event.preventDefault();
			event.dataTransfer.dropEffect = "copy";
		},
		[containsFiles],
	);

	const handleDragLeave = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!containsFiles(event)) {
				return;
			}
			event.preventDefault();
			dragCounterRef.current = Math.max(dragCounterRef.current - 1, 0);
			if (dragCounterRef.current === 0) {
				setIsDragActive(false);
			}
		},
		[containsFiles],
	);

	const handleFilesAdded = useCallback(
		async (incomingFiles: File[]) => {
			if (!selectedApp) {
				addToast({
					type: "warning",
					title: "Select an app",
					message: "Choose an app before attaching files.",
				});
				return;
			}

			const usableFiles = incomingFiles.filter(
				(file): file is File => file instanceof File && file.size > 0,
			);
			if (usableFiles.length === 0) {
				return;
			}

			const currentFiles = attachmentsRef.current;
			const existingNames = new Set(currentFiles.map((file) => file.name));
			const batchSeen = new Set<string>();
			const nextFiles = [...currentFiles];
			const uploads: Array<{
				file: File;
				uploading: ReturnType<typeof createUploadingFileData>;
				workspaceId: StageApp["workspaceId"];
			}> = [];

			for (const file of usableFiles) {
				const name = file.name || `file-${uploads.length + 1}`;
				if (existingNames.has(name) || batchSeen.has(name)) {
					addToast({
						type: "warning",
						title: "Duplicate file",
						message: `${name} is already attached.`,
					});
					continue;
				}

				batchSeen.add(name);
				const uploading = createUploadingFileData({
					name,
					type: file.type || "application/octet-stream",
					size: file.size,
				});
				nextFiles.push(uploading);
				uploads.push({
					file,
					uploading,
					workspaceId: selectedApp.workspaceId,
				});
			}

			if (uploads.length === 0) {
				return;
			}

			setAttachedFiles(nextFiles);

			for (const { file, uploading, workspaceId } of uploads) {
				try {
					await client.uploadFile({
						workspaceId,
						file,
						fileId: uploading.id,
						fileName: uploading.name,
					});
					const uploaded = createUploadedFileData(uploading, Date.now());
					setAttachedFiles((current) => {
						if (workspaceIdRef.current !== workspaceId) {
							return current;
						}
						return current.map((entry) =>
							entry.id === uploaded.id ? uploaded : entry,
						);
					});
				} catch (error) {
					const message = getUploadErrorMessage(error);
					addToast({
						type: "error",
						title: "Upload failed",
						message,
					});
					const failed = createFailedFileData(uploading, message);
					setAttachedFiles((current) => {
						if (workspaceIdRef.current !== workspaceId) {
							return current;
						}
						return current.map((entry) =>
							entry.id === failed.id ? failed : entry,
						);
					});
				}
			}
		},
		[selectedApp, client, addToast],
	);

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			if (!containsFiles(event)) {
				return;
			}
			event.preventDefault();
			dragCounterRef.current = 0;
			setIsDragActive(false);
			const droppedFiles = Array.from(event.dataTransfer?.files ?? []);
			void handleFilesAdded(droppedFiles);
		},
		[containsFiles, handleFilesAdded],
	);

	const handleFileInputChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = event.target.files ? Array.from(event.target.files) : [];
		void handleFilesAdded(files);
		event.target.value = "";
	};

	const handleRemoveFile = useCallback((fileId: string) => {
		setAttachedFiles((current) => current.filter((file) => file.id !== fileId));
	}, []);

	const handleAttachmentButtonClick = () => {
		fileInputRef.current?.click();
	};

	const hasInput = inputValue.trim().length > 0;
	const hasPendingUploads = attachedFiles.some(
		(file) => file.status === "uploading",
	);
	const canSubmit =
		!!selectedApp && hasInput && !isRunning && !hasPendingUploads;

	const handleSubmit = () => {
		if (!selectedApp || !inputValue.trim() || isRunning) return;
		if (hasPendingUploads) {
			addToast({
				type: "info",
				title: "Uploading files",
				message: "Please wait for uploads to finish before sending.",
			});
			return;
		}

		// Build inputs from the single text input
		// If app has parameters, use the first text parameter; otherwise send as generic input
		const textParam = selectedApp.parameters.find(
			(p) => p.type === "text" || p.type === "multiline-text",
		);

		const parameterItems = textParam
			? [{ name: textParam.id, type: "string" as const, value: inputValue }]
			: [{ name: "input", type: "string" as const, value: inputValue }];

		onSubmit({
			inputs: [
				{
					type: "parameters",
					items: parameterItems,
				},
			],
		});
		setAttachedFiles([]);
		attachmentsRef.current = [];
		setInputValue("");
		// Reset textarea height after clearing - use requestAnimationFrame for better timing
		requestAnimationFrame(() => {
			resizeTextarea();
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSubmit();
		}
	};

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
				<div className="relative z-10">
					{/* Textarea */}
					<textarea
						ref={textareaRef}
						value={inputValue}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						placeholder="Ask anything—powered by Giselle docs"
						rows={1}
						disabled={isRunning}
						className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-blue-muted/50 outline-none disabled:cursor-not-allowed min-h-[2.4em] sm:min-h-[2.75em] pt-0 pb-[0.7em] px-1"
					/>

					<FileAttachments
						files={attachedFiles}
						onRemoveFile={handleRemoveFile}
					/>

					{/* Bottom row: App selector and buttons */}
					<div className="flex items-center justify-between mt-2 sm:mt-3">
						{/* Left side: Attachment + App selector */}
						<div className="flex items-center gap-2 flex-1 max-w-[260px]">
							<button
								type="button"
								onClick={handleAttachmentButtonClick}
								className="flex h-6 w-6 flex-shrink-0 items-center justify-center"
								aria-label="Attach files"
							>
								<Paperclip className="h-4 w-4 text-text-muted" />
							</button>
							<div className="flex-1">
								<Select
									options={appOptions}
									placeholder="Select an app..."
									value={selectedApp?.id}
									onValueChange={onAppSelect}
									widthClassName="w-full"
									triggerClassName="border-none !bg-[rgba(131,157,195,0.1)] hover:!bg-[rgba(131,157,195,0.18)] !px-2 !h-8 sm:!h-9 !rounded-[7px] sm:!rounded-[9px] text-[13px] [&_svg]:opacity-70"
								/>
							</div>
						</div>

						{/* Right side: Send button */}
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
					<input
						ref={fileInputRef}
						type="file"
						className="hidden"
						multiple
						onChange={handleFileInputChange}
					/>
				</div>
			</section>
			{/* Keyboard shortcut hint (outside chat container, aligned bottom-right) */}
			<div className="mt-1 flex items-center justify-end gap-[6px] pr-0 text-[11px] text-blue-muted/60">
				<div className="flex items-center gap-[4px]">
					<div className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border border-blue-muted/40 bg-blue-muted/10">
						<span className="text-[10px] leading-none tracking-[0.08em]">
							⌘
						</span>
					</div>
					<div className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border border-blue-muted/40 bg-blue-muted/10">
						<span className="text-[10px] leading-none tracking-[0.08em]">
							↵
						</span>
					</div>
				</div>
				<span className="leading-none">to send</span>
			</div>
		</div>
	);
}

export function Page({
	dataLoader,
	createAndStartTaskAction,
}: {
	dataLoader: Promise<LoaderData>;
	createAndStartTaskAction: (
		inputs: CreateAndStartTaskInputs,
	) => Promise<TaskId>;
}) {
	const data = use(dataLoader);

	const router = useRouter();
	const [selectedAppId, setSelectedAppId] = useState<string | undefined>();
	const [runningAppId, setRunningAppId] = useState<string | undefined>();
	const [isRunning, startTransition] = useTransition();
	const [runStatus, setRunStatus] = useState<"idle" | "running" | "completed">(
		"idle",
	);
	const [appSearchQuery, setAppSearchQuery] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);
	const appSearchInputRef = useRef<HTMLInputElement | null>(null);

	const apps = useMemo(() => {
		const normalizedQuery = appSearchQuery.trim().toLowerCase();
		if (normalizedQuery.length === 0) {
			return data.apps;
		}
		return data.apps.filter((app) =>
			app.name.toLowerCase().includes(normalizedQuery),
		);
	}, [appSearchQuery, data.apps]);

	// Validate selectedAppId during render - if invalid, treat as undefined
	const selectedApp = selectedAppId
		? data.apps.find((app) => app.id === selectedAppId)
		: undefined;

	const handleAppSelect = useCallback(
		(appId: string) => {
			// Validate app exists before setting
			if (data.apps.some((app) => app.id === appId)) {
				setSelectedAppId(appId);
			} else {
				setSelectedAppId(undefined);
			}
		},
		[data.apps],
	);

	const runningApp = runningAppId
		? data.apps.find((app) => app.id === runningAppId)
		: undefined;

	const handleRunSubmit = useCallback(
		(event: { inputs: GenerationContextInput[] }) => {
			if (!selectedApp) return;
			setRunningAppId(selectedApp.id);
			setRunStatus("running");
			startTransition(async () => {
				try {
					const taskId = await createAndStartTaskAction({
						generationOriginType: "stage",
						nodeId: selectedApp.entryNodeId,
						inputs: event.inputs,
						workspaceId: selectedApp.workspaceId,
					});
					setRunStatus("completed");
					// Navigate to task page immediately when completed
					router.push(`/stage/tasks/${taskId}`);
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error("Failed to create and start task from stage:", error);
					setRunStatus("idle");
					setRunningAppId(undefined);
				}
			});
		},
		[selectedApp, createAndStartTaskAction, router],
	);

	return (
		<div className="w-full flex flex-col">
			<div className="flex items-stretch gap-4 min-w-0">
				{/* Main content: apps area */}
				<div className="flex-1 min-w-0 flex flex-col px-4 sm:px-[24px] pt-[24px]">
					{/* Top section: app info + chat input */}
					<div className="space-y-4 pb-8">
						<StageTopCard runningApp={runningApp} runStatus={runStatus} />

						{/* Chat-style input area */}
						<ChatInputArea
							selectedApp={selectedApp}
							apps={data.apps}
							onAppSelect={handleAppSelect}
							onSubmit={handleRunSubmit}
							isRunning={isRunning}
						/>
					</div>

					{/* App sections */}
					<div className="flex flex-col gap-8 w-full pb-8 pt-12">
						{/* Section 1: Sample apps from Giselle team */}
						{data.sampleApps.length > 0 && (
							<div className="flex flex-col">
								<div className="flex items-center justify-between max-w-[960px] mx-auto w-full px-2">
									<h2 className="mt-1 text-[16px] text-text-muted/80">
										Sample apps from Giselle team
									</h2>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
									{data.sampleApps.map((sampleApp) => (
										<AppListCard
											key={sampleApp.id}
											title={sampleApp.name}
											description={sampleApp.description}
											badgeType="sample"
											icon={
												<AppIcon
													defaultSize={false}
													className="h-5 w-5 text-white/40"
												/>
											}
											providers={sampleApp.llmProviders}
										/>
									))}
									{/*

									::::::::::: Sample implementations :::::::::

									<AppListCard
										title="Customer Support"
										description="A ready-made workflow that triages customer tickets, summarizes conversation history, and suggests high-quality replies for your support team."
										badgeType="sample"
										icon={
											<AppIcon
												defaultSize={false}
												className="h-5 w-5 text-white/40"
											/>
										}
										providers={["openai", "anthropic", "google", "perplexity"]}
									/>
									<AppListCard
										title="Tech Support"
										description="Handles bug reports, reproduces issues based on logs, and proposes potential fixes that engineers can review quickly."
										badgeType="sample"
										icon={
											<AppIcon
												defaultSize={false}
												className="h-5 w-5 text-white/40"
											/>
										}
										providers={["openai", "anthropic", "google"]}
									/>
									<AppListCard
										title="Product Manager"
										description="Aggregates user feedback, highlights trends, and drafts product requirement ideas your team can refine."
										badgeType="sample"
										icon={
											<AppIcon
												defaultSize={false}
												className="h-5 w-5 text-white/40"
											/>
										}
										providers={["openai", "anthropic"]}
									/>*/}
								</div>
							</div>
						)}

						{/* Section 2: Select an Apps to Run */}
						<div className="flex flex-col">
							<div className="flex items-center justify-between max-w-[960px] mx-auto w-full px-2">
								<h2 className="mt-1 text-[16px] text-text-muted/80">
									Select Your App to Run
								</h2>
								<div className="relative">
									{isSearchActive ? (
										<div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[13px] text-text shadow-[0_0_0_1px_rgba(255,255,255,0.12)] transition-all duration-150">
											<input
												ref={appSearchInputRef}
												type="text"
												value={appSearchQuery}
												onChange={(event) => {
													setAppSearchQuery(event.target.value);
												}}
												onBlur={() => {
													if (appSearchQuery.trim().length === 0) {
														setIsSearchActive(false);
													}
												}}
												placeholder="Search apps"
												className="w-[160px] bg-transparent text-[13px] text-text placeholder:text-text-muted outline-none border-none"
											/>
											<Search className="h-4 w-4 text-text-muted" />
										</div>
									) : (
										<button
											type="button"
											onClick={() => {
												setIsSearchActive(true);
												requestAnimationFrame(() => {
													appSearchInputRef.current?.focus();
												});
											}}
											className="group flex items-center gap-2 rounded-full px-3 py-1 text-[13px] text-text-muted transition-colors hover:bg-white/5"
										>
											<Search className="h-4 w-4 text-text-muted group-hover:text-text" />
											<span>Search apps</span>
										</button>
									)}
								</div>
							</div>
							{apps.length === 0 ? (
								<div className="pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
									<div className="w-full rounded-lg bg-[rgba(255,255,255,0.03)] shadow-[0_4px_16px_rgba(0,0,0,0.06)] px-6 py-6 text-center">
										<h3 className="flex items-center justify-center gap-2 text-[16px] font-medium text-blue-muted/80">
											<Sparkles className="h-4 w-4 text-blue-muted/80" />
											<span>No apps yet</span>
										</h3>
										<p className="mt-2 text-[13px] text-blue-muted/60 leading-relaxed">
											Build your first agent in Studio. Agents you create will
											appear here, ready to run in Stage.
										</p>
										<div className="mt-6 flex justify-center">
											<button
												type="button"
												onClick={() => {
													router.push("/workspaces");
												}}
												className="inline-flex items-center justify-center rounded-lg border border-[rgba(131,157,195,0.3)] px-4 py-2 text-[13px] text-[rgba(131,157,195,0.7)] transition-colors hover:border-[rgba(131,157,195,0.4)] hover:bg-[rgba(131,157,195,0.1)]"
											>
												Create your first app
											</button>
										</div>
									</div>
								</div>
							) : apps.length === 0 ? (
								<p className="text-sm text-muted-foreground max-w-[960px] mx-auto w-full">
									No apps match your search.
								</p>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
									{apps.map((app) => (
										<AppCard
											app={app}
											key={app.id}
											isSelected={
												selectedAppId === app.id || runningAppId === app.id
											}
											onSelect={() => {
												handleAppSelect(app.id);
											}}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
