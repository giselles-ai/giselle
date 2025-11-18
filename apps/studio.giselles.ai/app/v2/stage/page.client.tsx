"use client";

import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { AppEntryInputDialog } from "@giselle-internal/workflow-designer-ui";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import type { GenerationContextInput, TaskId } from "@giselles-ai/protocol";
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
			console.log("????");
			startTransition(async () => {
				const taskId = await onSubmitCreateAndStartTask(event);
				router.push(`/v2/stage/tasks/${taskId}`);
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
