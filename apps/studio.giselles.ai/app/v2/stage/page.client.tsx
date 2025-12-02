"use client";

import { Select, type SelectOption } from "@giselle-internal/ui/select";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import type { GenerationContextInput, TaskId } from "@giselles-ai/protocol";
import { ArrowUpIcon, Image as ImageIcon, Search } from "lucide-react";
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
import { AgentCard } from "@/app/(main)/workspaces/components/agent-card";
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
	isSelected: _isSelected = false,
}: {
	app: StageApp;
	onSelect?: () => void;
	isSelected?: boolean;
}) {
	return (
		<button
			type="button"
			className="rounded-lg border border-white px-4 py-3 flex items-center gap-3 text-left"
			onClick={onSelect}
		>
			<div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
				<span className="text-white text-sm font-semibold">A</span>
			</div>
			<div className="flex flex-col">
				<span className="text-text font-medium text-[14px]">{app.name}</span>
				<span className="text-text/60 text-[12px]">{app.teamName}</span>
			</div>
		</button>
	);
}

interface StageTopCardProps {
	runningApp?: StageApp;
	runStatus: "idle" | "running" | "completed";
}

function StageTopCard({ runningApp, runStatus }: StageTopCardProps) {
	return (
		<div className="relative flex w-full max-w-[960px] min-w-[320px] mx-auto flex-col overflow-hidden">
			{runningApp && runStatus === "running" && (
				<div className="pointer-events-none absolute inset-0 z-0">
					<TopLightOverlay />
				</div>
			)}
			<div className="w-full h-[144px] flex justify-center items-center">
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
							<p className="text-text-muted text-[12px] text-center leading-5"></p>
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
							Request tasks and Giselle-powered agents will execute them
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

// Chat-style input area for running apps
function ChatInputArea({
	selectedApp,
	apps,
	onAppSelect,
	onSubmit,
	isRunning: _isRunning,
}: {
	selectedApp?: StageApp;
	apps: StageApp[];
	onAppSelect: (appId: string) => void;
	onSubmit: (event: { inputs: GenerationContextInput[] }) => void;
	isRunning: boolean;
}) {
	const [inputValue, setInputValue] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	const appOptions: SelectOption[] = useMemo(
		() =>
			apps.map((app) => ({
				value: app.id,
				label: app.name,
				icon: <DynamicIcon name={app.iconName} className="h-4 w-4" />,
			})),
		[apps],
	);

	const resizeTextarea = useCallback(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
		}
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setInputValue(e.target.value);
			// Auto-resize textarea on input change
			resizeTextarea();
		},
		[resizeTextarea],
	);

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
		// Reset textarea height after clearing
		setTimeout(() => resizeTextarea(), 0);
	}, [selectedApp, inputValue, onSubmit, resizeTextarea]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				handleSubmit();
			}
		},
		[handleSubmit],
	);

	return (
		<div className="relative w-full max-w-[960px] min-w-[320px] mx-auto">
			<div className="border border-white rounded-[14px] pt-4 px-4 pb-2">
				{/* Textarea */}
				<textarea
					ref={textareaRef}
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder="Ask anything—powered by Giselle docs"
					rows={1}
					className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-foreground/40 outline-none"
				/>

				{/* Bottom row: App selector and buttons */}
				<div className="flex items-center justify-between mt-3">
					{/* Left side: App selector */}
					<div className="flex-1 max-w-[200px]">
						<Select
							options={appOptions}
							placeholder="Select an app..."
							value={selectedApp?.id}
							onValueChange={onAppSelect}
							widthClassName="w-full"
						/>
					</div>

					{/* Right side: Attachment + Send buttons */}
					<div className="flex items-center gap-2">
						<button
							type="button"
							className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] border border-white"
						>
							<ImageIcon className="h-3 w-3 stroke-white" />
						</button>
						<button
							type="button"
							onClick={handleSubmit}
							className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] border border-white"
						>
							<ArrowUpIcon className="h-3 w-3 stroke-white" />
						</button>
					</div>
				</div>
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
	// TODO: Use history apps if needed in the future
	const _historyApps = (() => {
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
	// TODO: Set up Giselle team apps later
	const _myApps =
		data.currentTeamId != null
			? data.apps.filter(
					(app) => app.isMine && app.teamId === data.currentTeamId,
				)
			: data.apps.filter((app) => app.isMine);

	const router = useRouter();
	const [selectedAppId, setSelectedAppId] = useState<string | undefined>();
	const [runningAppId, setRunningAppId] = useState<string | undefined>();
	const [isRunning, startTransition] = useTransition();
	const [runStatus, setRunStatus] = useState<"idle" | "running" | "completed">(
		"idle",
	);

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
				<div className="flex-1 min-w-0 flex flex-col px-[24px] pt-[24px]">
					{/* Top section: app info + chat input */}
					<div className="space-y-6 pb-6">
						<StageTopCard runningApp={runningApp} runStatus={runStatus} />

						{/* Chat-style input area */}
						<ChatInputArea
							selectedApp={selectedApp}
							apps={data.apps}
							onAppSelect={(appId) => setSelectedAppId(appId)}
							onSubmit={handleRunSubmit}
							isRunning={isRunning}
						/>
					</div>

					{/* App sections */}
					<div className="flex flex-col gap-8 w-full pb-8 pt-12">
						{/* Section 1: Sample apps from Giselle team */}
						<div className="flex flex-col">
							<h2 className="text-inverse text-[14px] max-w-[960px] mx-auto w-full text-center">
								Sample apps from Giselle team
							</h2>
							<div className="grid grid-cols-3 gap-3 pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
								<button
									type="button"
									className="rounded-lg border border-white px-4 py-3 flex items-center gap-3 text-left"
								>
									<div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
										<span className="text-white text-sm font-semibold">A</span>
									</div>
									<div className="flex flex-col">
										<span className="text-text font-medium text-[14px]">
											Customer Support
										</span>
										<span className="text-text/60 text-[12px]">
											Giselle Team
										</span>
									</div>
								</button>
								<button
									type="button"
									className="rounded-lg border border-white px-4 py-3 flex items-center gap-3 text-left"
								>
									<div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
										<span className="text-white text-sm font-semibold">A</span>
									</div>
									<div className="flex flex-col">
										<span className="text-text font-medium text-[14px]">
											Tech Support
										</span>
										<span className="text-text/60 text-[12px]">
											Giselle Team
										</span>
									</div>
								</button>
								<button
									type="button"
									className="rounded-lg border border-white px-4 py-3 flex items-center gap-3 text-left"
								>
									<div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
										<span className="text-white text-sm font-semibold">A</span>
									</div>
									<div className="flex flex-col">
										<span className="text-text font-medium text-[14px]">
											Product Manager
										</span>
										<span className="text-text/60 text-[12px]">
											Giselle Team
										</span>
									</div>
								</button>
							</div>
						</div>

						{/* Section 2: Select an Apps to Run */}
						<div className="flex flex-col">
							<div className="flex items-center justify-between max-w-[960px] mx-auto w-full px-4">
								<h2 className="text-inverse text-[16px]">
									Select an Apps to Run
								</h2>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
									<input
										type="text"
										placeholder="Search"
										className="pl-9 pr-4 py-2 rounded-lg border border-white bg-transparent text-text placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
									/>
								</div>
							</div>
							{teamApps.length === 0 ? (
								<p className="text-sm text-muted-foreground max-w-[960px] mx-auto w-full">
									No apps available.
								</p>
							) : (
								<div className="grid grid-cols-3 gap-3 pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
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

						{/* Section 3: Team apps */}
						<div className="flex flex-col">
							<div className="flex items-center justify-between max-w-[960px] mx-auto w-full px-4">
								<h2 className="text-inverse text-[16px]">
									Edit Apps in Studio
								</h2>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
									<input
										type="text"
										placeholder="Search"
										className="pl-9 pr-4 py-2 rounded-lg border border-white bg-transparent text-text placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
									/>
								</div>
							</div>
							{teamApps.length === 0 ? (
								<p className="text-sm text-muted-foreground max-w-[960px] mx-auto w-full">
									No apps found in Team apps.
								</p>
							) : (
								<div className="grid grid-cols-[repeat(auto-fill,minmax(267px,1fr))] gap-4 pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
									{teamApps.map((app) => {
										// Convert StageApp to AgentCard format
										const agentCardData = {
											id: app.id,
											name: app.name,
											description: app.description,
											workspaceId: app.workspaceId,
											githubRepositories: app.vectorStoreRepositories,
											documentVectorStoreFiles: app.vectorStoreFiles,
											llmProviders: app.llmProviders,
											creator: null,
											executionCount: 0,
										};
										return (
											<AgentCard
												key={app.id}
												agent={
													agentCardData as Parameters<
														typeof AgentCard
													>[0]["agent"]
												}
											/>
										);
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
