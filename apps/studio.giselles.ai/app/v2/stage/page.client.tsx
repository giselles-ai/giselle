"use client";

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import { formatTimestamp } from "@giselles-ai/lib/utils";
import type {
	GenerationContextInput,
	Task,
	TaskId,
} from "@giselles-ai/protocol";
import { File } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useRouter } from "next/navigation";
import {
	type FormEventHandler,
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
import { GitHubIcon } from "../../../../../internal-packages/workflow-designer-ui/src/icons";
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

function SimpleAppEntryForm({
	app,
	onSubmit,
	isRunning = false,
	onStop,
}: {
	app: StageApp;
	onSubmit: (event: { inputs: GenerationContextInput[] }) => void;
	isRunning?: boolean;
	onStop?: () => void;
}) {
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [isFormValid, setIsFormValid] = useState(false);
	const formRef = useRef<HTMLFormElement | null>(null);

	// Initialize validity for apps without required parameters
	useEffect(() => {
		const hasRequired = app.parameters.some((parameter) => parameter.required);
		if (!hasRequired) {
			setIsFormValid(true);
		}
	}, [app.parameters]);

	const handleChange = useCallback(() => {
		const formElement = formRef.current;
		if (!formElement) {
			return;
		}

		let valid = true;

		for (const parameter of app.parameters) {
			if (!parameter.required) {
				continue;
			}

			const field = formElement.elements.namedItem(
				parameter.name,
			) as HTMLInputElement | null;
			const value = field?.value.trim() ?? "";

			if (value === "") {
				valid = false;
				break;
			}
		}

		setIsFormValid(valid);
	}, [app.parameters]);

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();

			const formData = new FormData(e.currentTarget);
			const errors: Record<string, string> = {};
			const values: Record<string, string | number> = {};

			for (const parameter of app.parameters) {
				const formDataEntryValue = formData.get(parameter.name);
				const value = formDataEntryValue
					? formDataEntryValue.toString().trim()
					: "";

				if (parameter.required && value === "") {
					errors[parameter.id] = `${parameter.name} is required`;
					continue;
				}

				if (value === "") {
					values[parameter.id] = "";
					continue;
				}

				switch (parameter.type) {
					case "text":
					case "multiline-text":
						values[parameter.id] = value;
						break;
					case "number": {
						const numValue = Number(value);
						if (Number.isNaN(numValue)) {
							errors[parameter.id] = `${parameter.name} must be a valid number`;
						} else {
							values[parameter.id] = numValue;
						}
						break;
					}
					default: {
						const _exhaustiveCheck: never = parameter.type;
						throw new Error(`Unhandled input type: ${_exhaustiveCheck}`);
					}
				}
			}

			if (Object.keys(errors).length > 0) {
				setValidationErrors(errors);
				return;
			}

			setValidationErrors({});

			const parameterItems = Object.entries(values).map(([id, value]) => {
				if (typeof value === "number") {
					return {
						name: id,
						type: "number" as const,
						value,
					};
				}
				return {
					name: id,
					type: "string" as const,
					value: value as string,
				};
			});

			onSubmit({
				inputs: [
					{
						type: "parameters",
						items: parameterItems,
					},
				],
			});
		},
		[app, onSubmit],
	);

	const isSingleParameter = app.parameters.length === 1;

	const parameterFields = app.parameters.map((parameter) => (
		<div key={parameter.id} className="min-w-0">
			<div className="flex items-center gap-2">
				<input
					id={parameter.name}
					className={`rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-[1px] text-[14px] bg-background ${
						isRunning
							? "border-transparent text-foreground/60 w-auto"
							: "border-border text-foreground w-full"
					}`}
					type={parameter.type === "number" ? "number" : "text"}
					name={parameter.name}
					placeholder={isRunning ? "" : `Please enter ${parameter.name}`}
					required={parameter.required}
					onChange={handleChange}
					disabled={isRunning}
				/>
				{isRunning && (
					<span className="whitespace-nowrap text-xs text-link-muted">
						Running...
					</span>
				)}
			</div>
			{validationErrors[parameter.id] && (
				<p className="mt-1 text-xs text-red-500">
					{validationErrors[parameter.id]}
				</p>
			)}
		</div>
	));

	const submitButton = (
		<button
			type={isRunning ? "button" : "submit"}
			onClick={
				isRunning
					? () => {
							onStop?.();
						}
					: undefined
			}
			disabled={!isFormValid && !isRunning}
			className="relative flex h-[38px] flex-shrink-0 items-center justify-center gap-[8px] whitespace-nowrap rounded-full border px-[24px] text-[14px] font-[500] font-sans text-white outline-none transition-all hover:translate-y-[-1px] bg-primary-900 border-primary-900/30 hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary-700/60 focus-visible:ring-offset-1 cursor-pointer"
		>
			<span className="mr-[8px] generate-star">✦</span>
			<span>{isRunning ? "Stop" : "Run"}</span>
			<span className="ml-[8px] flex items-center gap-[2px] text-[11px] text-white/60">
				<kbd className="px-[4px] py-[1px] bg-white/20 rounded-[4px]">⌘</kbd>
				<kbd className="px-[4px] py-[1px] bg-white/20 rounded-[4px]">↵</kbd>
			</span>
		</button>
	);

	return (
		<form ref={formRef} onSubmit={handleSubmit} className="w-full">
			{isSingleParameter ? (
				<div className="flex w-full items-center gap-3">
					<div className="min-w-0 flex-1">{parameterFields}</div>
					{submitButton}
				</div>
			) : (
				<div className="flex w-full flex-col gap-3">
					{parameterFields}
					<div className="flex justify-end">{submitButton}</div>
				</div>
			)}
			<style jsx>{`
				.generate-star { display: inline-block; }
				.generate-star.generating { animation: continuousRotate 1s linear infinite; }
				button:hover .generate-star:not(.generating) { animation: rotateStar 0.7s ease-in-out; }
				@keyframes rotateStar {
					0% { transform: rotate(0deg) scale(1); }
					50% { transform: rotate(180deg) scale(1.5); }
					100% { transform: rotate(360deg) scale(1); }
				}
				@keyframes continuousRotate {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</form>
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
			className="w-full text-left px-3 py-3 rounded-lg border border-border bg-card/30 hover:bg-card/50 hover:border-white/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
	data: LoaderData;
	selectedApp?: StageApp;
	runningApp?: StageApp;
	runStatus: "idle" | "running" | "completed";
}

function StageTopCard({
	data,
	selectedApp,
	runningApp,
	runStatus,
}: StageTopCardProps) {
	return (
		<div className="relative flex w-full flex-col rounded-lg bg-card/40 overflow-hidden">
			{runningApp && runStatus === "running" && (
				<div className="pointer-events-none absolute inset-0 z-0">
					<TopLightOverlay />
				</div>
			)}
			{selectedApp ? (
				<div className="flex flex-col gap-6 lg:flex-row">
					{/* Left: thumbnail */}
					<div className="flex w-full flex-col items-center gap-4 lg:w-[240px] lg:flex-none lg:items-start">
						<div className="flex h-[240px] w-[240px] items-center justify-center rounded-[8px] bg-card/60 border border-border">
							<DynamicIcon
								name={selectedApp.iconName}
								className="h-12 w-12 text-foreground"
							/>
						</div>
					</div>

					{/* Right: app details */}
					<div className="flex w-full flex-col text-sm text-muted-foreground lg:flex-1">
						<h2 className="text-xl font-semibold text-foreground px-2 mb-1">
							{selectedApp.name}
						</h2>
						{selectedApp.description ? (
							<p className="mt-1 text-sm text-muted-foreground px-2 line-clamp-2">
								{selectedApp.description}
							</p>
						) : null}
						<div className="mt-5 space-y-4">
							<div className="flex flex-col gap-4 lg:flex-row">
								<div className="min-w-0 flex-1">
									<p className="text-link-muted text-[12px] block px-2 pb-1">
										Workspace
									</p>
									<p className="text-sm text-foreground px-4">
										{selectedApp.workspaceName}
									</p>
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-link-muted text-[12px] block px-2 pb-1">
										Team
									</p>
									<p className="text-sm text-foreground px-4">
										{selectedApp.teamName}
									</p>
								</div>
							</div>
							<div className="flex flex-col gap-4 lg:flex-row">
								<div className="min-w-0 flex-1">
									<p className="text-link-muted text-[12px] block px-2 pb-1">
										Vector store repositories
									</p>
									{selectedApp.vectorStoreRepositories.length > 0 ? (
										<div className="flex flex-col gap-1 px-4">
											{selectedApp.vectorStoreRepositories.map((repo) => (
												<div
													key={repo}
													className="flex items-center gap-2 text-sm text-foreground/70"
												>
													<GitHubIcon className="w-4 h-4 text-text/60" />
													<span className="truncate">{repo}</span>
												</div>
											))}
										</div>
									) : (
										<p className="text-sm text-foreground/70 px-4">
											Not configured yet
										</p>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-link-muted text-[12px] block px-2 pb-1">
										Vector store files
									</p>
									{selectedApp.vectorStoreFiles.length > 0 ? (
										<div className="flex flex-col gap-1 px-4">
											{selectedApp.vectorStoreFiles.map((fileName) => (
												<div
													key={fileName}
													className="flex items-center gap-2 text-sm text-foreground/70"
												>
													<File className="w-4 h-4 text-text/60" />
													<span className="truncate">{fileName}</span>
												</div>
											))}
										</div>
									) : (
										<p className="text-sm text-foreground/70 px-4">
											Not configured yet
										</p>
									)}
								</div>
							</div>
							<div>
								<p className="text-link-muted text-[12px] block px-2 pb-1">
									LLM
								</p>
								<div className="flex items-center gap-2 px-4 py-1">
									{selectedApp.llmProviders.length > 0 ? (
										selectedApp.llmProviders.map((provider) => (
											<div
												key={provider}
												className="w-7 h-7 rounded bg-[color:var(--color-inverse)]/10 flex items-center justify-center"
											>
												<LLMProviderIcon
													provider={provider}
													className="w-4 h-4"
												/>
											</div>
										))
									) : (
										<p className="text-sm text-foreground/70">
											Will be shown here in a future update
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className="relative bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_5%,transparent)] h-[240px] w-full rounded-[8px] flex justify-center items-center text-text-muted">
					<div className="flex flex-col items-center gap-[12px] text-text-muted relative z-10">
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
							<>
								<p className="font-[800] text-text/60">
									{data.apps.length > 0
										? "No app selected."
										: "No apps available yet."}
								</p>
								<p className="text-text-muted text-[12px] text-center leading-5">
									{data.apps.length > 0
										? "Please select an app from the lists below."
										: "Generate or adjust the Prompt to see results."}
								</p>
							</>
						)}
					</div>
				</div>
			)}
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
	const [isDialogOpen, setIsDialogOpen] = useState(false);
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
			if (!runningApp) return;
			setIsDialogOpen(false);
			setIsTaskSidebarOpen(true);
			setSelectedAppId(undefined);
			setRunStatus("running");
			startTransition(async () => {
				try {
					await createAndStartTaskAction({
						generationOriginType: "stage",
						nodeId: runningApp.entryNodeId,
						inputs: event.inputs,
						workspaceId: runningApp.workspaceId,
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
		[runningApp, createAndStartTaskAction],
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
				{/* Main content: heading + apps area */}
				<div className="flex-1 min-w-0 space-y-8 px-[24px] pt-[24px]">
					{/* Page heading */}
					<div className="flex items-center justify-between">
						<div>
							<PageHeading glow>Stage</PageHeading>
							<p className="mt-1 text-sm text-text-muted">
								Choose an app to start, review history, and explore your
								workflows.
							</p>
						</div>
					</div>

					<StageTopCard
						data={data}
						selectedApp={selectedApp}
						runningApp={runningApp}
						runStatus={runStatus}
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
														setRunningAppId(app.id);
														setIsDialogOpen(true);
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
														setRunningAppId(app.id);
														setIsDialogOpen(true);
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
														setRunningAppId(app.id);
														setIsDialogOpen(true);
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

			{/* Player dialog */}
			<Dialog
				open={isDialogOpen && runningApp !== undefined}
				onOpenChange={(open) => {
					setIsDialogOpen(open);
					if (!open && !isRunning) {
						setRunningAppId(undefined);
						setSelectedAppId(undefined);
					}
				}}
			>
				{runningApp && (
					<DialogContent variant="glass" className="max-w-[520px]">
						<DialogTitle className="sr-only">
							Run app {runningApp.name}
						</DialogTitle>
						<DialogClose
							className="absolute right-2 top-1 z-20 text-muted-foreground hover:text-foreground transition-colors rounded-sm"
							aria-label="Close running app"
							onClick={() => {
								setIsDialogOpen(false);
								setRunningAppId(undefined);
								setSelectedAppId(undefined);
							}}
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
								className="h-5 w-5"
							>
								<title>Close</title>
								<path d="M18 6 6 18" />
								<path d="m6 6 12 12" />
							</svg>
						</DialogClose>
						<div className="flex flex-col gap-3">
							{/* Top section: App info */}
							<div className="space-y-4">
								<div className="flex items-center gap-4">
									<div
										className={`relative flex h-[120px] w-[120px] flex-shrink-0 items-center justify-center overflow-hidden rounded-md border transition-all ${
											isRunning
												? "bg-[color-mix(in_srgb,hsl(192,73%,84%)_14%,transparent)] border-[hsl(192,73%,84%)] shadow-[0_0_22px_rgba(0,135,246,0.95)]"
												: "bg-card/60 border-[hsl(192,73%,84%)]"
										}`}
									>
										<DynamicIcon
											name={runningApp.iconName}
											className="relative z-[1] h-6 w-6 stroke-1 text-[hsl(192,73%,84%)]"
										/>
									</div>
									<div className="min-w-0">
										<h3 className="text-base font-semibold text-foreground">
											{runningApp.name}
										</h3>
										{runningApp.description ? (
											<p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
												{runningApp.description}
											</p>
										) : null}
									</div>
								</div>
								<div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] text-muted-foreground">
									<div className="min-w-0">
										<p className="text-link-muted text-[11px]">Workspace</p>
										<p className="truncate text-foreground text-sm">
											{runningApp.workspaceName}
										</p>
									</div>
									<div className="min-w-0">
										<p className="text-link-muted text-[11px]">Team</p>
										<p className="truncate text-foreground text-sm">
											{runningApp.teamName}
										</p>
									</div>
									<div className="min-w-0">
										<p className="text-link-muted text-[11px]">
											Vector store repositories
										</p>
										<p className="truncate text-sm">
											{runningApp.vectorStoreRepositories.length > 0
												? runningApp.vectorStoreRepositories[0]
												: "Not configured yet"}
										</p>
									</div>
									<div className="min-w-0">
										<p className="text-link-muted text-[11px]">
											Vector store files
										</p>
										<p className="truncate text-sm">
											{runningApp.vectorStoreFiles.length > 0
												? runningApp.vectorStoreFiles[0]
												: "Not configured yet"}
										</p>
									</div>
								</div>
								<div className="mt-2">
									<p className="text-link-muted text-[11px]">LLM</p>
									<div className="flex items-center gap-2 pt-1">
										{runningApp.llmProviders.length > 0 ? (
											runningApp.llmProviders.map((provider) => (
												<div
													key={provider}
													className="flex h-7 w-7 items-center justify-center rounded bg-[color:var(--color-inverse)]/10"
												>
													<LLMProviderIcon
														provider={provider}
														className="h-4 w-4"
													/>
												</div>
											))
										) : (
											<p className="text-xs text-foreground/70">
												Will be shown here in a future update
											</p>
										)}
									</div>
								</div>
							</div>

							<div className="border-t border-border/40" />

							{/* Bottom section: Input form */}
							<div className="flex-1 min-w-0 space-y-2">
								<p className="text-link-muted text-[11px]">Input parameters</p>
								<SimpleAppEntryForm
									app={runningApp}
									onSubmit={handleRunSubmit}
									isRunning={isRunning}
									onStop={() => {
										setRunningAppId(undefined);
									}}
								/>
							</div>
						</div>
					</DialogContent>
				)}
			</Dialog>
		</div>
	);
}
