"use client";

import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import { AppEntryInputDialog } from "@giselle-internal/workflow-designer-ui";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import { formatTimestamp } from "@giselles-ai/lib/utils";
import type {
	GenerationContextInput,
	Task,
	TaskId,
} from "@giselles-ai/protocol";
import { DynamicIcon } from "lucide-react/dynamic";
import { useRouter } from "next/navigation";
import { use, useCallback, useState, useTransition } from "react";
import { CreateWorkspaceButton } from "@/app/(main)/workspaces/create-workspace-button";
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
	onSubmitCreateAndStartTask,
}: {
	app: StageApp;
	onSubmitCreateAndStartTask: (event: {
		inputs: GenerationContextInput[];
	}) => Promise<TaskId>;
}) {
	const [_isPending, startTransition] = useTransition();
	const router = useRouter();
	const handleSubmit = useCallback(
		(event: { inputs: GenerationContextInput[] }) => {
			startTransition(async () => {
				const taskId = await onSubmitCreateAndStartTask(event);
				router.push(`/stage/tasks/${taskId}`);
			});
		},
		[onSubmitCreateAndStartTask, router],
	);
	return (
		<Dialog>
			<DialogTrigger className="w-full flex items-start gap-4 p-4 rounded-lg border border-border hover:border-border-muted transition-all text-left group cursor-pointer h-[100px]">
				<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
					<DynamicIcon name={app.iconName} className="h-6 w-6 text-white" />
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
						{app.name}
					</h3>
					<p className="text-sm text-muted-foreground line-clamp-2">
						{app.description}
					</p>
				</div>
			</DialogTrigger>
			<DialogContent variant="glass">
				<DialogTitle className="sr-only">
					verride inputs to test workflow
				</DialogTitle>

				<AppEntryInputDialog app={app} onSubmit={handleSubmit} />
			</DialogContent>
		</Dialog>
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
	const [selectedAppId, setSelectedAppId] = useState<string | undefined>(
		data.apps[0]?.id,
	);

	const selectedApp =
		data.apps.find((app) => app.id === selectedAppId) ?? data.apps[0];

	const handleSelectApp = (appId: string) => {
		setSelectedAppId(appId);
	};

	const filteredAppsForBottom =
		selectedApp != null
			? data.apps.filter((app) => app.teamId === selectedApp.teamId)
			: data.apps;

	return (
		<div className="max-w-[1200px] mx-auto w-full px-[24px] py-[24px]">
			<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.4fr)_minmax(260px,1fr)] gap-8">
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

					{/* Top container: Your apps + Selected app */}
					<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] gap-8 min-h-[420px]">
						{/* Left column: Your apps */}
						<div className="space-y-6">
							<section>
								<h2 className="text-2xl font-semibold text-foreground mb-4">
									Your apps
								</h2>
								{data.apps.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-8 px-4 border border-border rounded-lg bg-card/30">
										<p className="text-muted-foreground mb-4 text-center">
											You don't have any apps yet
										</p>
										<CreateWorkspaceButton label="Create your first app" />
									</div>
								) : (
									<div className="space-y-2 max-h-64 overflow-y-auto pr-1">
										{data.apps.map((app) => (
											<button
												type="button"
												key={app.id}
												onClick={() => handleSelectApp(app.id)}
												className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
													selectedApp?.id === app.id
														? "border-primary bg-primary/10 text-foreground"
														: "border-border bg-card/30 hover:bg-card/50"
												}`}
											>
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium line-clamp-1">
														{app.name}
													</span>
													<span className="text-xs text-muted-foreground line-clamp-1">
														{app.workspaceName}
													</span>
												</div>
												<p className="mt-1 text-xs text-muted-foreground line-clamp-2">
													{app.description}
												</p>
											</button>
										))}
									</div>
								)}
							</section>
						</div>

						{/* Right column: Selected app detail */}
						<div className="border border-border rounded-lg bg-card/40 p-6 flex flex-col">
							{selectedApp ? (
								<>
									<div className="flex items-start justify-between gap-4 mb-4">
										<div>
											<p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
												Selected app
											</p>
											<h2 className="text-2xl font-semibold text-foreground">
												{selectedApp.name}
											</h2>
											<p className="mt-2 text-sm text-muted-foreground max-w-xl">
												{selectedApp.description}
											</p>
										</div>
									</div>
									<div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
										<span>Workspace: {selectedApp.workspaceName}</span>
										<span>Team: {selectedApp.teamName}</span>
									</div>
									<div className="mt-6">
										<AppCard
											app={selectedApp}
											onSubmitCreateAndStartTask={(event) =>
												createAndStartTaskAction({
													generationOriginType: "stage",
													nodeId: selectedApp.entryNodeId,
													inputs: event.inputs,
													workspaceId: selectedApp.workspaceId,
												})
											}
										/>
									</div>
								</>
							) : (
								<div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
									No apps available yet.
								</div>
							)}
						</div>
					</div>

					{/* Bottom container: apps related to the selected app */}
					<div className="border border-border rounded-lg bg-card/20 p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold text-foreground">
								Apps
								{selectedApp ? ` in ${selectedApp.teamName}` : ""}
							</h2>
							<p className="text-xs text-muted-foreground">
								Select an app from the list above to focus this section.
							</p>
						</div>
						{filteredAppsForBottom.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No apps found for the current selection.
							</p>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{filteredAppsForBottom.map((app) => (
									<AppCard
										app={app}
										key={app.id}
										onSubmitCreateAndStartTask={(event) =>
											createAndStartTaskAction({
												generationOriginType: "stage",
												nodeId: app.entryNodeId,
												inputs: event.inputs,
												workspaceId: app.workspaceId,
											})
										}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Right sidebar: Histories as task bar */}
				<aside className="border border-border rounded-lg bg-card/30 p-4 flex flex-col h-full">
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
							Histories
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
			</div>
		</div>
	);
}
