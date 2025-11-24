"use client";

import { PageHeading } from "@giselle-internal/ui/page-heading";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import { formatTimestamp } from "@giselles-ai/lib/utils";
import type {
	GenerationContextInput,
	Task,
	TaskId,
} from "@giselles-ai/protocol";
import { File, PlayIcon } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useRouter } from "next/navigation";
import {
	type FormEventHandler,
	use,
	useCallback,
	useEffect,
	useState,
	useTransition,
} from "react";
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
}: {
	app: StageApp;
	onSubmit: (event: { inputs: GenerationContextInput[] }) => void;
}) {
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

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

	return (
		<form onSubmit={handleSubmit} className="w-full">
			<div className="flex items-center gap-3 w-full">
				<h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
					{app.name}
				</h3>
				{app.parameters.map((parameter) => (
					<div key={parameter.id} className="flex-1 min-w-0">
						<input
							id={parameter.name}
							className="w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-[1px] border-border text-[14px] bg-background"
							type={parameter.type === "number" ? "number" : "text"}
							name={parameter.name}
							placeholder={parameter.name}
							required={parameter.required}
						/>
						{validationErrors[parameter.id] && (
							<p className="text-xs text-red-500 mt-1">
								{validationErrors[parameter.id]}
							</p>
						)}
					</div>
				))}
				<button
					type="submit"
					className="flex-shrink-0 relative flex items-center justify-center outline-none overflow-hidden focus-visible:ring-2 focus-visible:ring-primary-700/60 focus-visible:ring-offset-1 px-6 h-[38px] rounded-lg gap-[6px] bg-gradient-to-b from-[#202530] to-[#12151f] text-white/80 border border-black/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-200 active:scale-[0.98] cursor-pointer"
				>
					<PlayIcon className="h-4 w-4 fill-current" />
					Run
				</button>
			</div>
		</form>
	);
}

function AppCard({ app, onSelect }: { app: StageApp; onSelect?: () => void }) {
	return (
		<button
			type="button"
			className="flex-none w-[180px] flex items-center gap-3 rounded-lg bg-card/30 hover:bg-card/50 text-left group cursor-pointer transition-all"
			onClick={onSelect}
		>
			<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-card/60 border border-border">
				<DynamicIcon name={app.iconName} className="h-7 w-7 text-foreground" />
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

	const getStatusColor = (status: Task["status"]) => {
		switch (status) {
			case "completed":
				return "bg-green-500/10 text-green-600 border-green-500/20";
			case "failed":
				return "bg-red-500/10 text-red-600 border-red-500/20";
			case "cancelled":
				return "bg-gray-500/10 text-gray-600 border-gray-500/20";
			case "inProgress":
				return "bg-blue-500/10 text-blue-600 border-blue-500/20";
			case "created":
				return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
			default:
				return "bg-gray-500/10 text-gray-600 border-gray-500/20";
		}
	};

	const formatDuration = (ms: number) => {
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
		if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
		return `${(ms / 3600000).toFixed(1)}h`;
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
			className="w-full text-left p-4 rounded-lg border border-border bg-card/30 hover:bg-card/50 hover:border-border-muted transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
		>
			<div className="flex items-start justify-between gap-3 mb-2">
				<h3 className="text-sm font-semibold text-foreground line-clamp-1 flex-1">
					{task.name || "Untitled Task"}
				</h3>
				<span
					className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(
						task.status,
					)}`}
				>
					{task.status}
				</span>
			</div>
			<div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
				<span>{formatTimestamp.toRelativeTime(task.createdAt)}</span>
				{task.duration.wallClock > 0 && (
					<span>• {formatDuration(task.duration.wallClock)}</span>
				)}
				{task.usage.totalTokens > 0 && (
					<span>• {formatTokenCount(task.usage.totalTokens)} tokens</span>
				)}
			</div>
			{totalSteps > 0 && (
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<span className="text-foreground/60">Steps:</span>
					{task.steps.completed > 0 && (
						<span className="text-green-600">
							{task.steps.completed} completed
						</span>
					)}
					{task.steps.inProgress > 0 && (
						<span className="text-blue-600">
							{task.steps.inProgress} in progress
						</span>
					)}
					{task.steps.failed > 0 && (
						<span className="text-red-600">{task.steps.failed} failed</span>
					)}
					{task.steps.queued > 0 && (
						<span className="text-yellow-600">{task.steps.queued} queued</span>
					)}
				</div>
			)}
		</button>
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
			// 現在選択中のチームに属するアプリだけを履歴対象にする
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

	const [selectedAppId, setSelectedAppId] = useState<string | undefined>(
		undefined,
	);
	const [runningAppId, setRunningAppId] = useState<string | undefined>(
		undefined,
	);
	const [navigationRailWidth, setNavigationRailWidth] = useState(0);
	const [_isPending, startTransition] = useTransition();
	const router = useRouter();

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

	// Track current navigation rail width so the bottom panel aligns with the right content area
	useEffect(() => {
		if (
			typeof window === "undefined" ||
			typeof ResizeObserver === "undefined"
		) {
			return;
		}
		const spacer = document.querySelector(
			"[data-navigation-rail-spacer]",
		) as HTMLElement | null;
		if (!spacer) {
			return;
		}
		const updateWidth = () => {
			const rect = spacer.getBoundingClientRect();
			setNavigationRailWidth(rect.width);
		};
		updateWidth();
		const observer = new ResizeObserver(() => {
			updateWidth();
		});
		observer.observe(spacer);
		return () => {
			observer.disconnect();
		};
	}, []);

	const handleRunSubmit = useCallback(
		(event: { inputs: GenerationContextInput[] }) => {
			if (!runningApp) return;
			startTransition(async () => {
				const taskId = await createAndStartTaskAction({
					generationOriginType: "stage",
					nodeId: runningApp.entryNodeId,
					inputs: event.inputs,
					workspaceId: runningApp.workspaceId,
				});
				setRunningAppId(undefined);
				router.push(`/stage/tasks/${taskId}`);
			});
		},
		[runningApp, createAndStartTaskAction, router],
	);

	return (
		<div className="max-w-[1200px] mx-auto w-full px-[24px] py-[24px]">
			<div className="grid grid-cols-1 gap-8">
				{/* Main content: heading + apps area */}
				<div className="space-y-8">
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

					{/* Top container: selected app detail */}
					<div className="rounded-lg bg-card/40 flex flex-col h-[420px]">
						{selectedApp ? (
							<div className="flex h-full flex-col gap-6 lg:flex-row lg:justify-between">
								{/* Left: thumbnail + name */}
								<div className="flex w-full flex-col items-center gap-4 lg:w-[280px] lg:flex-none lg:items-start">
									<div className="flex h-[280px] w-[280px] items-center justify-center rounded-[8px] bg-card/60 border border-border">
										<DynamicIcon
											name={selectedApp.iconName}
											className="h-12 w-12 text-foreground"
										/>
									</div>
								</div>

								{/* Right: app details */}
								<div className="flex w-full flex-col text-sm text-muted-foreground lg:w-[280px] lg:flex-none">
									<div>
										<h2 className="text-xl font-semibold text-foreground px-2">
											{selectedApp.name}
										</h2>
										{selectedApp.description ? (
											<p className="mt-1 text-sm text-muted-foreground px-2 line-clamp-2">
												{selectedApp.description}
											</p>
										) : null}
									</div>
									<div className="mt-5 space-y-4">
										<div>
											<p className="text-text-muted text-[13px] font-semibold px-2 pb-1">
												Workspace
											</p>
											<p className="text-sm text-foreground px-4">
												{selectedApp.workspaceName}
											</p>
										</div>
										<div>
											<p className="text-text-muted text-[13px] font-semibold px-2 pb-1">
												Team
											</p>
											<p className="text-sm text-foreground px-4">
												{selectedApp.teamName}
											</p>
										</div>
										<div>
											<p className="text-text-muted text-[13px] font-semibold px-2 pb-1">
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
										<div>
											<p className="text-text-muted text-[13px] font-semibold px-2 pb-1">
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
										<div>
											<p className="text-text-muted text-[13px] font-semibold px-2 pb-1">
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
							<div className="relative bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] h-full w-full rounded-[8px] flex justify-center items-center text-text-muted">
								<div className="flex flex-col items-center gap-[4px] text-text-muted">
									<p className="font-[800] text-text/60">
										No apps available yet.
									</p>
									<p className="text-text-muted text-[12px] text-center leading-5">
										Generate or adjust the Prompt to see results.
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Bottom container: three columns of apps */}
					<div className="rounded-lg bg-card/20">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{/* Column 1: History */}
							<div>
								<div className="flex items-center justify-between mb-3">
									<h2 className="text-sm font-normal text-[color:var(--color-text-60)]">
										Apps from history
									</h2>
								</div>
								{historyApps.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No apps found in history.
									</p>
								) : (
									<div className="flex flex-col gap-2">
										{historyApps.map((app) => (
											<AppCard
												app={app}
												key={app.id}
												onSelect={() => {
													setSelectedAppId(app.id);
													setRunningAppId(app.id);
												}}
											/>
										))}
									</div>
								)}
							</div>

							{/* Column 2: My apps */}
							<div>
								<div className="flex items-center justify-between mb-3">
									<h2 className="text-sm font-normal text-[color:var(--color-text-60)]">
										My apps
									</h2>
								</div>
								{myApps.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No apps found in My apps.
									</p>
								) : (
									<div className="flex flex-col gap-2">
										{myApps.map((app) => (
											<AppCard
												app={app}
												key={app.id}
												onSelect={() => {
													setSelectedAppId(app.id);
													setRunningAppId(app.id);
												}}
											/>
										))}
									</div>
								)}
							</div>

							{/* Column 3: Team apps */}
							<div>
								<div className="flex items-center justify-between mb-3">
									<h2 className="text-sm font-normal text-[color:var(--color-text-60)]">
										Team apps
									</h2>
								</div>
								{teamApps.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No apps found in Team apps.
									</p>
								) : (
									<div className="flex flex-col gap-2">
										{teamApps.map((app) => (
											<AppCard
												app={app}
												key={app.id}
												onSelect={() => {
													setSelectedAppId(app.id);
													setRunningAppId(app.id);
												}}
											/>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Right sidebar: Tasks history (temporarily hidden) */}
				{false && (
					<aside className="border border-border rounded-lg bg-card/30 p-4 flex flex-col h-full">
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
								Tasks
							</h2>
						</div>
						{data.tasks.length === 0 ? (
							<div className="flex flex-1 items-center justify-center px-3 py-4 text-sm text-muted-foreground text-center">
								No task history yet
							</div>
						) : (
							<div className="space-y-3 overflow-y-auto pr-1">
								{data.tasks.map((task) => (
									<TaskCard key={task.id} task={task} />
								))}
							</div>
						)}
					</aside>
				)}
			</div>

			{/* Bottom fixed player panel */}
			{runningApp && (
				<div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
					<div
						className="pointer-events-auto px-[24px] py-4 bg-card/95 backdrop-blur-md border-t border-border shadow-lg"
						style={{
							marginLeft: navigationRailWidth,
							width: `calc(100vw - ${navigationRailWidth}px)`,
						}}
					>
						<div className="max-w-[1200px] mx-auto w-full">
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-3 flex-shrink-0">
									<div className="relative flex h-14 w-14 items-center justify-center rounded-md bg-card/60 border border-border overflow-hidden">
										<div className="stage-star-border-bottom" />
										<div className="stage-star-border-top" />
										<DynamicIcon
											name={runningApp.iconName}
											className="relative z-[1] h-6 w-6 text-foreground"
										/>
									</div>
								</div>
								<div className="flex-1 min-w-0">
									<SimpleAppEntryForm
										app={runningApp}
										onSubmit={handleRunSubmit}
									/>
								</div>
								<button
									type="button"
									onClick={() => setRunningAppId(undefined)}
									className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
									aria-label="Close running app"
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
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
