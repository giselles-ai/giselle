"use client";

import { Select, type SelectOption } from "@giselle-internal/ui/select";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import type { GenerationContextInput, TaskId } from "@giselles-ai/protocol";
import { ArrowUpIcon, Image as ImageIcon, Search } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { useRouter } from "next/navigation";
import { use, useCallback, useRef, useState, useTransition } from "react";
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

type AppListCardBadgeType =
	| "sample"
	| "your-team"
	| "other-team"
	| "official"
	| "ambassador";

interface AppListCardProps {
	title: string;
	badgeType: AppListCardBadgeType;
	onClick?: () => void;
}

function AppListCard({ title, badgeType, onClick }: AppListCardProps) {
	const badgeConfig: Record<
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

	const { label } = badgeConfig[badgeType];

	return (
		<button
			type="button"
			className="rounded-lg border border-white px-4 py-3 flex items-center gap-3 text-left"
			onClick={onClick}
		>
			<div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
				<span className="text-white text-sm font-semibold">A</span>
			</div>
			<div className="flex flex-col">
				<span className="text-text font-medium text-[14px]">{title}</span>
				<span className="text-text/60 text-[12px]">{label}</span>
			</div>
		</button>
	);
}

function AppCard({
	app,
	onSelect,
	isSelected: _isSelected = false,
}: {
	app: StageApp;
	onSelect?: () => void;
	isSelected?: boolean;
}) {
	const badgeType: AppListCardBadgeType = app.isMine
		? "your-team"
		: "other-team";

	return (
		<AppListCard title={app.name} badgeType={badgeType} onClick={onSelect} />
	);
}

interface StageTopCardProps {
	runningApp?: StageApp;
	runStatus: "idle" | "running" | "completed";
}

function StageTopCard({ runningApp, runStatus }: StageTopCardProps) {
	return (
		<div className="relative flex w-full max-w-[960px] min-w-[320px] mx-auto flex-col overflow-hidden">
			<div className="w-full flex justify-center items-center py-2">
				<div className="flex flex-col items-center relative z-10">
					{runningApp && runStatus === "running" ? (
						<p className="font-[800] text-text/60 text-[16px]">
							Creating task...
						</p>
					) : (
						<p className="font-thin text-[36px] font-sans text-blue-muted/50 text-center">
							What's the task? Your agent's on it.
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
	isRunning,
}: {
	selectedApp?: StageApp;
	apps: StageApp[];
	onAppSelect: (appId: string) => void;
	onSubmit: (event: { inputs: GenerationContextInput[] }) => void;
	isRunning: boolean;
}) {
	const [inputValue, setInputValue] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	const appOptions: SelectOption[] = apps.map((app) => ({
		value: app.id,
		label: app.name,
		icon: <DynamicIcon name={app.iconName} className="h-4 w-4" />,
	}));

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

	const handleSubmit = () => {
		if (!selectedApp || !inputValue.trim() || isRunning) return;

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

	const hasInput = inputValue.trim().length > 0;

	return (
		<div className="relative w-full max-w-[640px] min-w-[320px] mx-auto">
			<div className="bg-blue-muted/10 rounded-[14px] shadow-[inset_0_1px_4px_rgba(0,0,0,0.22)] pt-4 px-2 pb-2">
				{/* Textarea */}
				<textarea
					ref={textareaRef}
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder="Ask anything—powered by Giselle docs"
					rows={1}
					disabled={isRunning}
					className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-blue-muted/50 outline-none disabled:cursor-not-allowed min-h-[2.75em] pt-0 pb-[0.7em] px-1"
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
							triggerClassName="border-none !bg-blue-muted/10 hover:!bg-[rgba(131,157,195,0.15)] !px-3"
						/>
					</div>

					{/* Right side: Attachment + Send buttons */}
					<div className="flex items-center gap-2">
						<button
							type="button"
							className="flex h-6 w-6 flex-shrink-0 items-center justify-center"
						>
							<ImageIcon className="h-5 w-5 stroke-white" />
						</button>
						<button
							type="button"
							onClick={handleSubmit}
							disabled={isRunning || !selectedApp || !inputValue.trim()}
							className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] bg-[color:var(--color-inverse)] disabled:cursor-not-allowed ${
								hasInput ? "opacity-100" : "opacity-40"
							}`}
						>
							<ArrowUpIcon className="h-3 w-3 text-[color:var(--color-background)]" />
						</button>
					</div>
				</div>
			</div>
			{/* Keyboard shortcut hint (outside chat container, aligned bottom-right) */}
			<div className="mt-3 flex items-center justify-end gap-1 pr-1 text-[11px] text-blue-muted/60">
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
	const [appSearchQuery, setAppSearchQuery] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);
	const appSearchInputRef = useRef<HTMLInputElement | null>(null);

	const filteredTeamApps =
		appSearchQuery.trim().length === 0
			? teamApps
			: teamApps.filter((app) =>
					app.name.toLowerCase().includes(appSearchQuery.toLowerCase()),
				);

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
				<div className="flex-1 min-w-0 flex flex-col px-[24px] pt-[24px]">
					{/* Top section: app info + chat input */}
					<div className="space-y-6 pb-6">
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
						<div className="flex flex-col">
							<div className="flex items-center justify-between max-w-[960px] mx-auto w-full px-4">
								<h2 className="text-text/80 text-[16px]">
									Sample apps from Giselle team
								</h2>
							</div>
							<div className="grid grid-cols-3 gap-3 pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
								<AppListCard title="Customer Support" badgeType="sample" />
								<AppListCard title="Tech Support" badgeType="sample" />
								<AppListCard title="Product Manager" badgeType="sample" />
							</div>
						</div>

						{/* Section 2: Select an Apps to Run */}
						<div className="flex flex-col">
							<div className="flex items-center justify-between max-w-[960px] mx-auto w-full px-4">
								<h2 className="text-text/80 text-[16px]">
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
							{teamApps.length === 0 ? (
								<p className="text-sm text-muted-foreground max-w-[960px] mx-auto w-full">
									No apps available.
								</p>
							) : filteredTeamApps.length === 0 ? (
								<p className="text-sm text-muted-foreground max-w-[960px] mx-auto w-full">
									No apps match your search.
								</p>
							) : (
								<div className="grid grid-cols-3 gap-3 pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
									{filteredTeamApps.map((app) => (
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
