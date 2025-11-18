"use client";

import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
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
import { use, useCallback, useTransition } from "react";
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
	return (
		<div className="max-w-7xl mx-auto px-8 py-12">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Histories */}
				<div>
					<h2 className="text-2xl font-semibold text-foreground mb-6">
						Histories
					</h2>
					{data.tasks.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 px-4 border border-border rounded-lg bg-card/30">
							<p className="text-muted-foreground text-center">
								No task history yet
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{data.tasks.map((task) => (
								<TaskCard key={task.id} task={task} />
							))}
						</div>
					)}
				</div>
				{/* Histories */}

				{/* Your apps */}
				<div>
					<h2 className="text-2xl font-semibold text-foreground mb-6">
						Your apps
					</h2>
					{data.apps.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 px-4 border border-border rounded-lg bg-card/30">
							<p className="text-muted-foreground mb-4 text-center">
								You don't have any apps yet
							</p>
							<CreateWorkspaceButton label="Create your first app" />
						</div>
					) : (
						<div className="space-y-3">
							{data.apps.map((app) => (
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
				{/* Your apps */}

				{/* Suggested apps */}
				{/*<div>
					<h2 className="text-2xl font-semibold text-foreground mb-6">
						Suggested apps
					</h2>
					<div className="space-y-3">
						{suggestedApps.map((app) => (
							<AppCard {...app} key={app.id} />
						))}
					</div>
				</div>*/}
				{/* Suggested apps */}
			</div>
		</div>
	);
}
