"use client";

import { PageHeading } from "@giselle-internal/ui/page-heading";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import { formatTimestamp } from "@giselles-ai/lib/utils";
import type {
	GenerationContextInput,
	Task,
	TaskId,
} from "@giselles-ai/protocol";
import { Clock3Icon, File, FolderKanbanIcon, PlayIcon } from "lucide-react";
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
import { CreateWorkspaceButton } from "@/app/(main)/workspaces/create-workspace-button";
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
		<form onSubmit={handleSubmit} className="flex items-center gap-3 w-full">
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

	const [listSource, setListSource] = useState<
		"history" | "myApps" | "teamApps"
	>(
		historyApps.length > 0
			? "history"
			: myApps.length > 0
				? "myApps"
				: "teamApps",
	);

	const sourceApps =
		listSource === "history"
			? historyApps
			: listSource === "myApps"
				? myApps
				: teamApps;

	const [selectedAppId, setSelectedAppId] = useState<string | undefined>(
		undefined,
	);
	const [runningAppId, setRunningAppId] = useState<string | undefined>(
		undefined,
	);
	const [_isPending, startTransition] = useTransition();
	const router = useRouter();

	useEffect(() => {
		if (!selectedAppId) return;
		if (!sourceApps.some((app) => app.id === selectedAppId)) {
			setSelectedAppId(undefined);
		}
	}, [selectedAppId, sourceApps]);

	const selectedApp = selectedAppId
		? sourceApps.find((app) => app.id === selectedAppId)
		: undefined;

	const runningApp = runningAppId
		? data.apps.find((app) => app.id === runningAppId)
		: undefined;

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

					{/* Top container: menu (history / my apps) + Selected app */}
					<div className="flex flex-col lg:flex-row lg:justify-between h-[420px]">
						{/* Left column: menu (history / my apps) */}
						<div className="space-y-4 lg:w-[200px] lg:flex-none">
							<section>
								<div className="space-y-2">
									<button
										type="button"
										onClick={() => setListSource("history")}
										className={`w-full flex items-center gap-3 px-2 py-1 rounded-md transition-colors ${
											listSource === "history"
												? "bg-primary/15"
												: "hover:bg-card/20"
										}`}
									>
										<div
											className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
												listSource === "history"
													? "bg-[color:var(--color-inverse)] text-[color:var(--color-link-accent)]"
													: "bg-transparent text-[color:var(--color-text-60)]"
											}`}
										>
											<Clock3Icon className="h-5 w-5" />
										</div>
										<div className="text-left">
											<span
												className={`text-base tracking-wide ${
													listSource === "history"
														? "text-[color:var(--color-text)]"
														: "text-[color:var(--color-text-60)]"
												}`}
											>
												Histories
											</span>
										</div>
									</button>
									<button
										type="button"
										onClick={() => setListSource("myApps")}
										className={`w-full flex items-center gap-3 px-2 py-1 rounded-md transition-colors ${
											listSource === "myApps"
												? "bg-primary/15"
												: "hover:bg-card/20"
										}`}
									>
										<div
											className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
												listSource === "myApps"
													? "bg-[color:var(--color-inverse)] text-[color:var(--color-link-accent)]"
													: "bg-transparent text-[color:var(--color-text-60)]"
											}`}
										>
											<FolderKanbanIcon className="h-5 w-5" />
										</div>
										<div className="text-left">
											<span
												className={`text-base tracking-wide ${
													listSource === "myApps"
														? "text-[color:var(--color-text)]"
														: "text-[color:var(--color-text-60)]"
												}`}
											>
												My app
											</span>
										</div>
									</button>
									<button
										type="button"
										onClick={() => setListSource("teamApps")}
										className={`w-full flex items-center gap-3 px-2 py-1 rounded-md transition-colors ${
											listSource === "teamApps"
												? "bg-primary/15"
												: "hover:bg-card/20"
										}`}
									>
										<div
											className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
												listSource === "teamApps"
													? "bg-[color:var(--color-inverse)] text-[color:var(--color-link-accent)]"
													: "bg-transparent text-[color:var(--color-text-60)]"
											}`}
										>
											<div className="size-8 flex items-center justify-center">
												<svg
													className="size-4"
													viewBox="0 0 22 22"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
													role="img"
													aria-label="Members"
												>
													<g clipPath="url(#clip0_member)">
														<path
															fillRule="evenodd"
															clipRule="evenodd"
															d="M20.2693 18.0815C20.2693 18.0815 19.3023 17.8466 18.1972 16.9265C17.7091 16.5252 17.6631 16.2316 17.6078 14.7731C17.5802 13.9999 17.5434 13.0407 17.3684 11.7878C16.8987 8.37179 14.2188 7.61812 12.7638 7.68663C12.819 7.55939 12.8467 7.43214 12.8467 7.28532C12.8467 5.49412 12.3586 4.10422 11.3916 3.17436C10.1019 1.92027 8.43069 1.98902 8.17349 1.9996L8.16842 1.9998C6.76863 1.91171 4.03351 2.63602 3.56384 6.10098C3.39808 7.36363 3.36124 8.31306 3.33361 9.08632C3.27836 10.5447 3.23231 10.8384 2.75343 11.2397C1.66675 12.15 0.727419 12.3849 0.727419 12.3849C0.230124 12.4925 -0.0921968 13.0211 0.0183131 13.5496C0.110405 14.0097 0.48798 14.3229 0.920811 14.3229C0.985275 14.3229 1.04974 14.3229 1.1142 14.3033C1.25234 14.274 2.47716 13.9705 3.90458 12.7764C5.07982 11.7908 5.11996 10.6884 5.17495 9.17826L5.17544 9.16462L5.17984 9.04836V9.04834C5.20635 8.34443 5.23897 7.47828 5.38726 6.37504C5.71879 3.92804 7.68955 3.91825 8.07633 3.94762C8.10685 3.94762 8.13104 3.9409 8.15939 3.93303L8.17763 3.92804C8.19237 3.92804 8.2071 3.93117 8.22183 3.9343C8.24394 3.939 8.26604 3.9437 8.28814 3.93783L8.29071 3.9377C8.35062 3.93453 9.42116 3.87776 10.176 4.6132C10.7286 5.16133 11.0141 6.05204 11.0141 7.26575C11.0141 7.49087 11.0969 7.68663 11.2167 7.85303C9.89054 8.24455 8.41707 9.32123 8.08554 11.778C7.91978 13.0407 7.88294 13.9999 7.85531 14.7634C7.80006 16.2218 7.75401 16.5154 7.27513 16.9167C6.18845 17.827 5.25833 18.0619 5.24912 18.0619C4.75182 18.1696 4.4295 18.6981 4.54001 19.2267C4.6321 19.6867 5.00968 19.9999 5.44251 19.9999H5.44253C5.50699 19.9999 5.57144 19.9999 5.6359 19.9804C5.77404 19.951 6.99886 19.6476 8.42628 18.4534C9.60152 17.4678 9.64166 16.3654 9.69665 14.8553L9.69714 14.8417L9.70154 14.7254C9.72805 14.0215 9.76067 13.1553 9.90895 12.0521C10.2405 9.60508 12.202 9.60508 12.598 9.62466C12.6164 9.62466 12.6349 9.62221 12.6533 9.61976C12.6717 9.61732 12.6901 9.61487 12.7085 9.61487C12.7193 9.61487 12.7315 9.61784 12.744 9.6209C12.7635 9.62567 12.7838 9.63063 12.8006 9.62466C13.0493 9.60508 15.2042 9.51699 15.545 12.0521C15.7015 13.2071 15.7384 14.1076 15.766 14.8319C15.8212 16.3001 15.8673 17.4551 17.0645 18.4534C18.5011 19.6476 19.7535 19.951 19.8917 19.9804C19.9562 19.9902 20.0206 19.9999 20.0851 19.9999C20.5087 19.9999 20.8863 19.6867 20.9784 19.2267C21.0889 18.6981 20.7666 18.1794 20.2785 18.0619L20.2693 18.0815ZM11.585 12.0716C10.5075 12.0716 10.5075 13.853 11.585 13.853C12.6625 13.853 12.6625 12.0716 11.585 12.0716ZM14.0254 12.0716C12.948 12.0716 12.948 13.853 14.0254 13.853C15.1029 13.853 15.1029 12.0716 14.0254 12.0716ZM7.06325 6.39459C5.98578 6.39459 5.98578 8.17601 7.06325 8.17601C8.14072 8.17601 8.14072 6.39459 7.06325 6.39459ZM9.5037 6.39459C8.42623 6.39459 8.42623 8.17601 9.5037 8.17601C10.5812 8.17601 10.5812 6.39459 9.5037 6.39459Z"
															fill="currentColor"
														/>
													</g>
													<defs>
														<clipPath id="clip0_member">
															<rect width="22" height="22" fill="white" />
														</clipPath>
													</defs>
												</svg>
											</div>
										</div>
										<div className="text-left">
											<span
												className={`text-base tracking-wide ${
													listSource === "teamApps"
														? "text-[color:var(--color-text)]"
														: "text-[color:var(--color-text-60)]"
												}`}
											>
												Team apps
											</span>
										</div>
									</button>
								</div>
							</section>

							{data.apps.length === 0 && (
								<section>
									<div className="flex flex-col items-center justify-center py-6 px-4 border border-border rounded-lg bg-card/30">
										<p className="text-muted-foreground mb-4 text-center text-sm">
											You don't have any apps yet
										</p>
										<CreateWorkspaceButton label="Create your first app" />
									</div>
								</section>
							)}
						</div>

						{/* Right column: Selected app detail */}
						<div
							className={
								selectedApp
									? "mt-6 lg:mt-0 rounded-lg bg-card/40 flex flex-col h-full lg:w-[680px] lg:flex-none"
									: "mt-6 lg:mt-0 rounded-lg bg-card/40 flex flex-col h-full lg:w-[680px] lg:flex-none"
							}
						>
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
					</div>

					{/* Bottom container: apps from current menu selection */}
					<div className="rounded-lg bg-card/20">
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-sm font-normal text-[color:var(--color-text-60)]">
								{listSource === "history"
									? "Apps from history"
									: listSource === "myApps"
										? "My apps"
										: "Team apps"}
							</h2>
						</div>
						{sourceApps.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No apps found for the current selection.
							</p>
						) : (
							<div className="flex gap-4 overflow-x-auto pb-2">
								{sourceApps.map((app) => (
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
				<div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg">
					<div className="max-w-[1200px] mx-auto px-[24px] py-4">
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-3 flex-shrink-0">
								<div className="flex h-12 w-12 items-center justify-center rounded-md bg-card/60 border border-border">
									<DynamicIcon
										name={runningApp.iconName}
										className="h-6 w-6 text-foreground"
									/>
								</div>
								<div>
									<h3 className="text-sm font-semibold text-foreground">
										{runningApp.name}
									</h3>
									{runningApp.description && (
										<p className="text-xs text-muted-foreground">
											{runningApp.description}
										</p>
									)}
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
			)}
		</div>
	);
}
