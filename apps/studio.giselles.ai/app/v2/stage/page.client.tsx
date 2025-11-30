"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import { formatTimestamp } from "@giselles-ai/lib/utils";
import type {
	GenerationContextInput,
	Task,
	TaskId,
} from "@giselles-ai/protocol";
import { ArrowUpIcon, PaperclipIcon, XIcon } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useRouter } from "next/navigation";
import {
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { TopLightOverlay } from "@/app/(main)/lobby/components/top-light-overlay";
import { LLMProviderIcon } from "@/app/(main)/workspaces/components/llm-provider-icon";
import type { LoaderData } from "./data-loader";
import type { StageApp } from "./types";

// const suggestedApps: App[] = [
// 	{
// 		id: "data-analyzer",
// 		name: "Data Analyzer",
// 		description: "Extract insights from your data",
// 		iconName: "chart-bar",
// 	},
// 	{
// 		id: "email-writer",
// 		name: "Email Writer",
// 		description: "Compose professional emails",
// 		iconName: "mail",
// 	},
// 	{
// 		id: "code-reviewer",
// 		name: "Code Reviewer",
// 		description: "Review and improve code quality",
// 		iconName: "code",
// 	},
// 	{
// 		id: "research-assistant",
// 		name: "Research Assistant",
// 		description: "Deep research and analysis",
// 		iconName: "brain",
// 	},
// 	{
// 		id: "creative-brainstorm",
// 		name: "Creative Brainstorm",
// 		description: "Generate creative ideas",
// 		iconName: "sparkles",
// 	},
// ];

function AppCard({
	app,
	onSelect,
	isSelected = false,
}: {
	app: StageApp;
	onSelect?: () => void;
	isSelected?: boolean;
}) {
	return (
		<button
			type="button"
			className="flex-none w-[180px] flex items-center gap-3 rounded-lg bg-card/30 hover:bg-card/50 text-left group cursor-pointer transition-all"
			onClick={onSelect}
		>
			<div
				className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors ${
					isSelected
						? "bg-[color-mix(in_srgb,hsl(192,73%,84%)_14%,transparent)] border-[hsl(192,73%,84%)] shadow-[0_0_22px_rgba(0,135,246,0.95)]"
						: "bg-card/60 border-border"
				}`}
			>
				<DynamicIcon
					name={app.iconName}
					className={`h-5 w-5 stroke-1 ${
						isSelected ? "text-[hsl(192,73%,84%)]" : "text-foreground"
					}`}
				/>
			</div>
			<div className="flex-1 min-w-0">
				<h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
					{app.name}
				</h3>
			</div>
		</button>
	);
}

function TaskCard({ task }: { task: Task }) {
	const router = useRouter();
	const totalSteps =
		task.steps.queued +
		task.steps.inProgress +
		task.steps.completed +
		task.steps.warning +
		task.steps.cancelled +
		task.steps.failed;

	const getStatusBadgeStatus = (status: Task["status"]) => {
		switch (status?.toLowerCase()) {
			case "completed":
			case "success":
				return "success" as const;
			case "failed":
			case "error":
				return "error" as const;
			case "running":
			case "processing":
			case "inprogress":
				return "info" as const;
			case "queued":
			case "pending":
			case "created":
				return "warning" as const;
			case "cancelled":
			case "ignored":
				return "ignored" as const;
			default:
				return "info" as const;
		}
	};

	const formatTokenCount = (count: number) => {
		if (count < 1000) return count.toString();
		if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
		return `${(count / 1000000).toFixed(1)}M`;
	};

	const handleClick = () => {
		router.push(`/stage/tasks/${task.id}`);
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className="w-full text-left px-3 py-3 rounded-lg border border-border bg-card/30 hover:bg-card/50 hover:border-white/20 transition-all cursor-pointer focus:outline-none"
		>
			<div className="flex items-start justify-between gap-3 mb-2">
				<h3 className="text-sm font-semibold text-foreground line-clamp-1 flex-1">
					{task.name || "Untitled Task"}
				</h3>
				<StatusBadge status={getStatusBadgeStatus(task.status)} variant="dot">
					{task.status}
				</StatusBadge>
			</div>
			<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
				<span>{formatTimestamp.toRelativeTime(task.createdAt)}</span>
				{task.usage.totalTokens > 0 && (
					<span>• {formatTokenCount(task.usage.totalTokens)} tokens</span>
				)}
				{totalSteps > 0 && (
					<span>
						Steps: {task.steps.completed}/{totalSteps}
					</span>
				)}
			</div>
		</button>
	);
}

interface StageTopCardProps {
	selectedApp?: StageApp;
	runningApp?: StageApp;
	runStatus: "idle" | "running" | "completed";
	onDeselect?: () => void;
}

function StageTopCard({
	selectedApp,
	runningApp,
	runStatus,
	onDeselect,
}: StageTopCardProps) {
	return (
		<div className="relative flex w-full max-w-[720px] min-w-[320px] mx-auto flex-col overflow-hidden">
			{runningApp && runStatus === "running" && (
				<div className="pointer-events-none absolute inset-0 z-0">
					<TopLightOverlay />
				</div>
			)}
			{selectedApp ? (
				<div className="relative flex items-center gap-4 p-4 rounded-lg bg-card/40">
					{/* Close button */}
					<button
						type="button"
						onClick={onDeselect}
						className="absolute top-2 right-2 p-1 rounded-md text-foreground/50 hover:text-foreground hover:bg-white/10 transition-all cursor-pointer"
					>
						<XIcon className="h-4 w-4" />
					</button>
					{/* App icon */}
					<div
						className={`relative flex h-[80px] w-[80px] flex-shrink-0 items-center justify-center overflow-hidden rounded-md border transition-all ${
							runStatus === "running"
								? "bg-[color-mix(in_srgb,hsl(192,73%,84%)_14%,transparent)] border-[hsl(192,73%,84%)] shadow-[0_0_22px_rgba(0,135,246,0.95)]"
								: "bg-card/60 border-border"
						}`}
					>
						<DynamicIcon
							name={selectedApp.iconName}
							className={`relative z-[1] h-8 w-8 stroke-1 ${
								runStatus === "running"
									? "text-[hsl(192,73%,84%)]"
									: "text-foreground"
							}`}
						/>
					</div>
					{/* App details */}
					<div className="min-w-0 flex-1">
						<h3 className="text-lg font-semibold text-foreground">
							{selectedApp.name}
						</h3>
						{selectedApp.description ? (
							<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
								{selectedApp.description}
							</p>
						) : null}
						<div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
							<span>{selectedApp.workspaceName}</span>
							<span className="text-border">•</span>
							<span>{selectedApp.teamName}</span>
							{selectedApp.llmProviders.length > 0 && (
								<>
									<span className="text-border">•</span>
									<div className="flex items-center gap-1">
										{selectedApp.llmProviders.map((provider) => (
											<div
												key={provider}
												className="flex h-5 w-5 items-center justify-center rounded bg-[color:var(--color-inverse)]/10"
											>
												<LLMProviderIcon
													provider={provider}
													className="h-3 w-3"
												/>
											</div>
										))}
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			) : (
				<div className="w-full flex justify-center items-center py-[32px]">
					<div className="flex flex-col items-center relative z-10">
						{runningApp && runStatus === "completed" ? (
							<>
								<p className="font-[800] text-green-500">Completed</p>
								<div className="mt-2 flex items-center gap-3">
									<div className="relative flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-[hsl(192,73%,84%)] bg-[color-mix(in_srgb,hsl(192,73%,84%)_14%,transparent)] shadow-[0_0_22px_rgba(0,135,246,0.95)]">
										<DynamicIcon
											name={runningApp.iconName}
											className="relative z-[1] h-6 w-6 stroke-1 text-[hsl(192,73%,84%)]"
										/>
									</div>
								</div>
							</>
						) : runningApp && runStatus === "running" ? (
							<>
								<p className="font-[800] text-text/60">Creating task...</p>
								<p className="text-text-muted text-[12px] text-center leading-5">
									You can track progress in the Tasks panel on the right.
								</p>
								<div className="mt-2 flex items-center gap-3">
									<div className="stage-running-icon relative flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-[hsl(192,73%,84%)] bg-[color-mix(in_srgb,hsl(192,73%,84%)_14%,transparent)] shadow-[0_0_22px_rgba(0,135,246,0.95)]">
										<DynamicIcon
											name={runningApp.iconName}
											className="relative z-[1] h-6 w-6 stroke-1 text-[hsl(192,73%,84%)]"
										/>
									</div>
								</div>
							</>
						) : (
							<p
								className="font-thin text-[36px] font-sans text-[hsl(192,73%,84%)] text-center"
								style={{
									textShadow:
										"0 0 15px rgb(0,135,246), 0 0 30px rgb(0,135,246), 0 0 45px rgb(0,135,246), 0 0 70px rgb(0,135,246)",
								}}
							>
								Select an app to run in Stage.
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

// Chat-style input area for running apps
function ChatInputArea({
	selectedApp,
	onSubmit,
	isRunning,
}: {
	selectedApp?: StageApp;
	onSubmit: (event: { inputs: GenerationContextInput[] }) => void;
	isRunning: boolean;
}) {
	const [inputValue, setInputValue] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const isDisabled = !selectedApp || isRunning;

	const handleSubmit = useCallback(() => {
		if (!selectedApp || !inputValue.trim()) return;

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
		setInputValue("");
	}, [selectedApp, inputValue, onSubmit]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				handleSubmit();
			}
		},
		[handleSubmit],
	);

	// Auto-resize textarea
	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
		}
	});

	return (
		<div className="relative w-full max-w-[720px] min-w-[320px] mx-auto">
			{/* Outer container - glassmorphism with blur */}
			<div
				className={`relative rounded-[20px] p-[6px] transition-all shadow-[0_8px_32px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2)] ${
					isDisabled ? "opacity-50" : ""
				}`}
				style={{
					background: "rgba(255, 255, 255, 0.08)",
					backdropFilter: "blur(12px)",
					WebkitBackdropFilter: "blur(12px)",
				}}
			>
				{/* Animated background glow - fluid-like effect */}
				<div className="absolute inset-0 -z-10 overflow-visible pointer-events-none">
					{/* Purple blob - moves slowly left-right */}
					<div
						className="absolute w-40 h-40 rounded-full blur-[80px] opacity-40 animate-[blob1_8s_ease-in-out_infinite]"
						style={{
							background: "hsl(270, 70%, 50%)",
							left: "-10%",
							top: "50%",
						}}
					/>
					{/* Pink blob - moves diagonally */}
					<div
						className="absolute w-36 h-36 rounded-full blur-[70px] opacity-35 animate-[blob2_10s_ease-in-out_infinite]"
						style={{
							background: "hsl(320, 70%, 60%)",
							left: "30%",
							top: "0%",
						}}
					/>
					{/* Blue blob - center bottom */}
					<div
						className="absolute w-48 h-32 rounded-full blur-[60px] opacity-30 animate-[blob3_12s_ease-in-out_infinite]"
						style={{
							background: "hsl(210, 80%, 55%)",
							left: "50%",
							bottom: "-20%",
						}}
					/>
					{/* Cyan blob - moves right side */}
					<div
						className="absolute w-32 h-32 rounded-full blur-[70px] opacity-35 animate-[blob4_9s_ease-in-out_infinite]"
						style={{
							background: "hsl(192, 73%, 50%)",
							right: "-5%",
							top: "30%",
						}}
					/>
				</div>

				{/* Inner container - subtle background */}
				<div className="relative rounded-[14px] bg-background/50 p-4">
					{/* Top row: Textarea */}
					<textarea
						ref={textareaRef}
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={
							selectedApp
								? `Message ${selectedApp.name}...`
								: "What do you want to do?"
						}
						disabled={isDisabled}
						rows={1}
						className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-foreground/40 outline-none disabled:cursor-not-allowed"
					/>

					{/* Bottom row: Buttons */}
					<div className="flex items-center justify-between mt-3">
						{/* Left side: Attachment button - neumorphism raised style */}
						<button
							type="button"
							disabled={isDisabled}
							className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] transition-all border border-white/5 shadow-[2px_2px_4px_rgba(0,0,0,0.4),-1px_-1px_3px_rgba(255,255,255,0.06)] ${
								isDisabled
									? "opacity-30 cursor-not-allowed bg-white/80 text-black/50"
									: "bg-white/80 text-black/70 hover:bg-white/90 hover:text-black/80 cursor-pointer active:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]"
							}`}
						>
							<PaperclipIcon className="h-3 w-3" />
						</button>

						{/* Right side: Send button - neumorphism raised style */}
						<button
							type="button"
							onClick={handleSubmit}
							disabled={isDisabled || !inputValue.trim()}
							className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] transition-all border border-white/5 shadow-[2px_2px_4px_rgba(0,0,0,0.4),-1px_-1px_3px_rgba(255,255,255,0.06)] ${
								isDisabled || !inputValue.trim()
									? "opacity-30 cursor-not-allowed bg-white/80 text-black/50"
									: "bg-white/80 text-black/70 hover:bg-white/90 hover:text-black/80 cursor-pointer active:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]"
							}`}
						>
							<ArrowUpIcon className="h-3 w-3" />
						</button>
					</div>
				</div>
			</div>

			{/* Keyboard shortcut hint */}
			<div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-foreground/40">
				<span className="flex items-center gap-1">
					<kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">
						⌘
					</kbd>
					<kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px]">
						↵
					</kbd>
					<span className="ml-1">to send</span>
				</span>
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
	const historyApps = (() => {
		const map = new Map<string, StageApp>();
		for (const task of data.tasks) {
			const app = data.apps.find(
				(candidate) => candidate.workspaceId === task.workspaceId,
			);
			if (app === undefined) continue;
			// Only include apps belonging to the currently selected team in history
			if (
				data.currentTeamId !== undefined &&
				app.teamId !== data.currentTeamId
			) {
				continue;
			}
			if (!map.has(app.id)) {
				map.set(app.id, app);
			}
		}
		return Array.from(map.values());
	})();

	const teamApps = data.currentTeamId
		? data.apps.filter((app) => app.teamId === data.currentTeamId)
		: data.apps;
	const myApps =
		data.currentTeamId != null
			? data.apps.filter(
					(app) => app.isMine && app.teamId === data.currentTeamId,
				)
			: data.apps.filter((app) => app.isMine);

	const [selectedAppId, setSelectedAppId] = useState<string | undefined>();
	const [runningAppId, setRunningAppId] = useState<string | undefined>();
	const [isRunning, startTransition] = useTransition();
	const [isTaskSidebarOpen, setIsTaskSidebarOpen] = useState(false);
	const [runStatus, setRunStatus] = useState<"idle" | "running" | "completed">(
		"idle",
	);
	const [isAppListScrollable, setIsAppListScrollable] = useState(false);
	const [isAppListAtStart, setIsAppListAtStart] = useState(true);
	const [isAppListAtEnd, setIsAppListAtEnd] = useState(false);
	const appListScrollRef = useRef<HTMLDivElement | null>(null);
	const [isTaskListScrollable, setIsTaskListScrollable] = useState(false);
	const [isTaskListAtTop, setIsTaskListAtTop] = useState(true);
	const [isTaskListAtBottom, setIsTaskListAtBottom] = useState(false);
	const taskListScrollRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!selectedAppId) return;
		if (!data.apps.some((app) => app.id === selectedAppId)) {
			setSelectedAppId(undefined);
		}
	}, [selectedAppId, data.apps]);

	const selectedApp = selectedAppId
		? data.apps.find((app) => app.id === selectedAppId)
		: undefined;

	const runningApp = runningAppId
		? data.apps.find((app) => app.id === runningAppId)
		: undefined;

	const sevenDaysAgo = useMemo(() => {
		const d = new Date();
		d.setDate(d.getDate() - 7);
		return d;
	}, []);

	const recentTasks = useMemo(
		() =>
			data.tasks
				.filter((task) => {
					const createdAt = new Date(task.createdAt);
					if (Number.isNaN(createdAt.getTime())) {
						return true;
					}
					return createdAt >= sevenDaysAgo;
				})
				.slice(0, 20),
		[data.tasks, sevenDaysAgo],
	);

	// Track app list horizontal scroll to show edge gradients similar to music apps
	useEffect(() => {
		const element = appListScrollRef.current;
		if (!element) {
			return;
		}

		const updateScrollState = () => {
			const maxScrollLeft = element.scrollWidth - element.clientWidth;
			setIsAppListScrollable(maxScrollLeft > 1);
			setIsAppListAtStart(element.scrollLeft <= 0);
			setIsAppListAtEnd(element.scrollLeft >= maxScrollLeft - 1);
		};

		updateScrollState();
		element.addEventListener("scroll", updateScrollState);
		window.addEventListener("resize", updateScrollState);

		return () => {
			element.removeEventListener("scroll", updateScrollState);
			window.removeEventListener("resize", updateScrollState);
		};
	}, []);

	// Track task list vertical scroll to show top/bottom gradients in the sidebar
	useEffect(() => {
		const element = taskListScrollRef.current;
		if (!element) {
			return;
		}

		const updateScrollState = () => {
			const maxScrollTop = element.scrollHeight - element.clientHeight;
			setIsTaskListScrollable(maxScrollTop > 1);
			setIsTaskListAtTop(element.scrollTop <= 0);
			setIsTaskListAtBottom(element.scrollTop >= maxScrollTop - 1);
		};

		updateScrollState();
		element.addEventListener("scroll", updateScrollState);
		window.addEventListener("resize", updateScrollState);

		return () => {
			element.removeEventListener("scroll", updateScrollState);
			window.removeEventListener("resize", updateScrollState);
		};
	}, []);

	const handleRunSubmit = useCallback(
		(event: { inputs: GenerationContextInput[] }) => {
			if (!selectedApp) return;
			setIsTaskSidebarOpen(true);
			setRunningAppId(selectedApp.id);
			setRunStatus("running");
			startTransition(async () => {
				try {
					await createAndStartTaskAction({
						generationOriginType: "stage",
						nodeId: selectedApp.entryNodeId,
						inputs: event.inputs,
						workspaceId: selectedApp.workspaceId,
					});
					setRunStatus("completed");
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error("Failed to create and start task from stage:", error);
					setRunStatus("idle");
					setRunningAppId(undefined);
				}
			});
		},
		[selectedApp, createAndStartTaskAction],
	);

	useEffect(() => {
		if (runStatus !== "completed") {
			return;
		}

		const timer = setTimeout(() => {
			setRunStatus("idle");
			setRunningAppId(undefined);
		}, 2000);

		return () => {
			clearTimeout(timer);
		};
	}, [runStatus]);

	return (
		<div className="w-full h-screen flex flex-col">
			<div className="flex items-stretch gap-4 min-w-0 flex-1">
				{/* Main content: apps area */}
				<div className="flex-1 min-w-0 space-y-6 px-[24px] pt-[24px]">
					<StageTopCard
						selectedApp={selectedApp}
						runningApp={runningApp}
						runStatus={runStatus}
						onDeselect={() => setSelectedAppId(undefined)}
					/>

					{/* Chat-style input area */}
					<ChatInputArea
						selectedApp={selectedApp}
						onSubmit={handleRunSubmit}
						isRunning={isRunning}
					/>

					{/* Bottom container: three columns of apps */}
					<div className="relative rounded-lg bg-card/20 w-full">
						<div
							ref={appListScrollRef}
							className="overflow-x-auto scrollbar-hide"
							style={{
								scrollbarWidth: "none",
								msOverflowStyle: "none",
							}}
						>
							<div className="flex gap-6 w-max pr-4">
								{/* Column 1: History */}
								<div className="flex flex-col w-[280px] flex-shrink-0">
									<div className="flex items-center justify-between mb-3">
										<h2 className="text-link-muted text-[12px] block">
											Apps from history
										</h2>
									</div>
									{historyApps.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No apps found in history.
										</p>
									) : (
										<div className="flex flex-col gap-4">
											{historyApps.map((app) => (
												<AppCard
													app={app}
													key={app.id}
													isSelected={
														selectedAppId === app.id || runningAppId === app.id
													}
													onSelect={() => {
														setSelectedAppId(app.id);
													}}
												/>
											))}
										</div>
									)}
								</div>

								{/* Column 2: My apps */}
								<div className="flex flex-col w-[280px] flex-shrink-0">
									<div className="flex items-center justify-between mb-3">
										<h2 className="text-link-muted text-[12px] block">
											My apps
										</h2>
									</div>
									{myApps.length === 0 ? (
										<p className="text-sm text-muted-foreground/70">
											No apps found in My apps.
										</p>
									) : (
										<div className="flex flex-col gap-4">
											{myApps.map((app) => (
												<AppCard
													app={app}
													key={app.id}
													isSelected={
														selectedAppId === app.id || runningAppId === app.id
													}
													onSelect={() => {
														setSelectedAppId(app.id);
													}}
												/>
											))}
										</div>
									)}
								</div>

								{/* Column 3: Team apps */}
								<div className="flex flex-col w-[280px] flex-shrink-0">
									<div className="flex items-center justify-between mb-3">
										<h2 className="text-link-muted text-[12px] block">
											Team apps
										</h2>
									</div>
									{teamApps.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No apps found in Team apps.
										</p>
									) : (
										<div className="flex flex-col gap-4">
											{teamApps.map((app) => (
												<AppCard
													app={app}
													key={app.id}
													isSelected={
														selectedAppId === app.id || runningAppId === app.id
													}
													onSelect={() => {
														setSelectedAppId(app.id);
													}}
												/>
											))}
										</div>
									)}
								</div>
							</div>
						</div>
						{isAppListScrollable && !isAppListAtStart && (
							<div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[color:var(--color-background)] to-transparent" />
						)}
						{isAppListScrollable && !isAppListAtEnd && (
							<div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[color:var(--color-background)] to-transparent" />
						)}
					</div>
				</div>

				{/* Right sidebar: Tasks history (outside main container) */}
				{isTaskSidebarOpen && (
					<>
						<div className="self-stretch w-px bg-border/60" />
						<aside className="relative w-[280px] h-screen rounded-lg bg-card/30 flex flex-col py-[24px] mr-4 overflow-hidden">
							<div className="flex items-center justify-between mb-3">
								<h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
									Tasks
								</h2>
								<button
									type="button"
									onClick={() => {
										setIsTaskSidebarOpen(false);
									}}
									className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
									aria-label="Close tasks sidebar"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="h-4 w-4"
									>
										<title>Close tasks</title>
										<path d="M18 6 6 18" />
										<path d="m6 6 12 12" />
									</svg>
								</button>
							</div>
							{recentTasks.length === 0 ? (
								<div className="flex flex-1 items-center justify-center px-3 py-4 text-sm text-muted-foreground text-center">
									No task history yet
								</div>
							) : (
								<div
									ref={taskListScrollRef}
									className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 scrollbar-hide"
									style={{
										scrollbarWidth: "none",
										msOverflowStyle: "none",
									}}
								>
									{recentTasks.map((task) => (
										<TaskCard key={task.id} task={task} />
									))}
								</div>
							)}

							{isTaskListScrollable && !isTaskListAtTop && (
								<div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-[color:var(--color-background)] to-transparent" />
							)}
							{isTaskListScrollable && !isTaskListAtBottom && (
								<div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-[color:var(--color-background)] to-transparent" />
							)}
						</aside>
					</>
				)}
			</div>
		</div>
	);
}
