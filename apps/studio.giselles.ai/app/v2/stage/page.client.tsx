"use client";

import { DocsLink } from "@giselle-internal/ui/docs-link";
import { Select, type SelectOption } from "@giselle-internal/ui/select";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import { GitHubIcon } from "@giselles-ai/icons/github";
import type { GenerationContextInput, TaskId } from "@giselles-ai/protocol";
import {
	ArrowUpIcon,
	FileIcon,
	HeadphonesIcon,
	PaperclipIcon,
	UserIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import {
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { ActionCard } from "@/app/(main)/lobby/components/action-card";
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
			className={`flex flex-col w-[140px] flex-shrink-0 rounded-[12px] p-3 text-left group cursor-pointer transition-all ${
				isSelected
					? "bg-[color-mix(in_srgb,hsl(192,73%,84%)_14%,transparent)] border border-[hsl(192,73%,84%)] shadow-[0_0_22px_rgba(0,135,246,0.95)]"
					: "bg-card/40 border border-white/15 hover:bg-card/60 hover:border-white/30"
			}`}
			onClick={onSelect}
		>
			{/* App icon area */}
			<div
				className={`w-full aspect-square rounded-[8px] mb-3 flex items-center justify-center transition-colors ${
					isSelected
						? "bg-[color-mix(in_srgb,hsl(192,73%,84%)_20%,transparent)]"
						: "bg-card/60"
				}`}
			>
				<DynamicIcon
					name={app.iconName}
					className={`h-8 w-8 stroke-1 ${
						isSelected ? "text-[hsl(192,73%,84%)]" : "text-foreground"
					}`}
				/>
			</div>
			{/* App info */}
			<h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
				{app.name}
			</h3>
			{app.description && (
				<p className="text-xs text-muted-foreground line-clamp-2">
					{app.description}
				</p>
			)}
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
		<div className="relative flex w-full max-w-[960px] min-w-[320px] mx-auto flex-col overflow-hidden">
			{runningApp && runStatus === "running" && (
				<div className="pointer-events-none absolute inset-0 z-0">
					<TopLightOverlay />
				</div>
			)}
			{selectedApp ? (
				<div className="relative flex items-center gap-4 px-4 py-[32px] rounded-lg bg-card/40">
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
						className="relative flex h-[80px] w-[80px] flex-shrink-0 items-center justify-center overflow-hidden rounded-md border transition-all bg-[color-mix(in_srgb,hsl(192,73%,84%)_14%,transparent)] border-[hsl(192,73%,84%)]"
						style={{
							boxShadow: "0 0 10px rgb(0,135,246), 0 0 20px rgb(0,135,246)",
						}}
					>
						<DynamicIcon
							name={selectedApp.iconName}
							className="relative z-[1] h-8 w-8 stroke-1 text-[hsl(192,73%,84%)]"
						/>
					</div>
					{/* App details */}
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<h3 className="text-lg font-semibold text-foreground">
								{selectedApp.name}
							</h3>
							{runningApp && runStatus === "running" && (
								<span className="text-sm text-text-muted">Generating...</span>
							)}
						</div>
						{selectedApp.description ? (
							<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
								{selectedApp.description}
							</p>
						) : null}
						<div className="mt-2 flex flex-col gap-2 text-xs">
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-2">
									<span className="font-medium text-text-muted">
										Workspace:
									</span>
									<span className="text-text">{selectedApp.workspaceName}</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-medium text-text-muted">LLM:</span>
									<div className="flex items-center gap-1">
										{selectedApp.llmProviders.length > 0 ? (
											selectedApp.llmProviders.map((provider) => (
												<div
													key={provider}
													className="flex h-5 w-5 items-center justify-center rounded bg-[color:var(--color-inverse)]/10"
												>
													<LLMProviderIcon
														provider={provider}
														className="h-3 w-3"
													/>
												</div>
											))
										) : (
											<span className="text-text">-</span>
										)}
									</div>
								</div>
							</div>
							{(selectedApp.vectorStoreRepositories.length > 0 ||
								selectedApp.vectorStoreFiles.length > 0) && (
								<div className="flex items-center gap-2">
									<span className="font-medium text-text-muted">
										Vector Store:
									</span>
									<div className="flex flex-wrap items-center gap-2">
										{selectedApp.vectorStoreRepositories.map((repo) => (
											<div key={repo} className="flex items-center gap-1.5">
												<GitHubIcon className="w-3 h-3 text-text/60 flex-shrink-0" />
												<span className="truncate text-text">{repo}</span>
											</div>
										))}
										{selectedApp.vectorStoreFiles.map((file) => (
											<div key={file} className="flex items-center gap-1.5">
												<FileIcon className="w-3 h-3 text-text/60 flex-shrink-0" />
												<span className="truncate text-text">{file}</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			) : (
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
	const isDisabled = !selectedApp || isRunning;

	const appOptions: SelectOption[] = useMemo(
		() =>
			apps.map((app) => ({
				value: app.id,
				label: app.name,
				icon: <DynamicIcon name={app.iconName} className="h-4 w-4" />,
			})),
		[apps],
	);

	const [submittedValue, setSubmittedValue] = useState("");

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

		setSubmittedValue(inputValue);
		onSubmit({
			inputs: [
				{
					type: "parameters",
					items: parameterItems,
				},
			],
		});
		if (!isRunning) {
			setInputValue("");
		}
	}, [selectedApp, inputValue, onSubmit, isRunning]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				handleSubmit();
			}
		},
		[handleSubmit],
	);

	// Reset submitted value when running stops
	useEffect(() => {
		if (!isRunning) {
			setSubmittedValue("");
			setInputValue("");
		}
	}, [isRunning]);

	// Auto-resize textarea
	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
		}
	});

	return (
		<div className="relative w-full max-w-[960px] min-w-[320px] mx-auto">
			{/* Outer container - subtle glassmorphism */}
			<div
				className={`relative rounded-[20px] p-[6px] transition-all shadow-[0_4px_16px_rgba(0,0,0,0.15)] ${
					isDisabled ? "opacity-50" : ""
				}`}
				style={{
					background: "rgba(255, 255, 255, 0.04)",
					backdropFilter: "blur(8px)",
					WebkitBackdropFilter: "blur(8px)",
					border: isRunning
						? "1px solid transparent"
						: "1px solid rgba(255,255,255,0.08)",
				}}
			>
				{isRunning && (
					<div
						className="absolute inset-0 rounded-[20px] pointer-events-none"
						style={{
							background:
								"linear-gradient(90deg, transparent 0%, hsl(210,80%,55%) 20%, hsl(192,73%,84%) 50%, hsl(210,80%,55%) 80%, transparent 100%)",
							backgroundSize: "200% 100%",
							animation: "border-glow-rotate 2s linear infinite",
							mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
							maskComposite: "exclude",
							WebkitMask:
								"linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
							WebkitMaskComposite: "xor",
							padding: "1px",
						}}
					/>
				)}
				{/* Animated background glow - subtle fluid effect */}
				<div className="absolute inset-0 -z-10 overflow-visible pointer-events-none">
					{/* Purple blob - moves slowly left-right */}
					<div
						className="absolute w-40 h-40 rounded-full blur-[80px] opacity-20 animate-[blob1_8s_ease-in-out_infinite]"
						style={{
							background: "hsl(270, 70%, 50%)",
							left: "-10%",
							top: "50%",
						}}
					/>
					{/* Pink blob - moves diagonally */}
					<div
						className="absolute w-36 h-36 rounded-full blur-[70px] opacity-15 animate-[blob2_10s_ease-in-out_infinite]"
						style={{
							background: "hsl(320, 70%, 60%)",
							left: "30%",
							top: "0%",
						}}
					/>
					{/* Blue blob - center bottom */}
					<div
						className="absolute w-48 h-32 rounded-full blur-[60px] opacity-15 animate-[blob3_12s_ease-in-out_infinite]"
						style={{
							background: "hsl(210, 80%, 55%)",
							left: "50%",
							bottom: "-20%",
						}}
					/>
					{/* Cyan blob - moves right side */}
					<div
						className="absolute w-32 h-32 rounded-full blur-[70px] opacity-15 animate-[blob4_9s_ease-in-out_infinite]"
						style={{
							background: "hsl(192, 73%, 50%)",
							right: "-5%",
							top: "30%",
						}}
					/>
				</div>

				{/* Inner container - subtle background */}
				<div className="relative rounded-[14px] bg-link-muted/10 pt-4 px-4 pb-2">
					{/* Textarea */}
					<textarea
						ref={textareaRef}
						value={
							isRunning && submittedValue
								? `${submittedValue} + generating`
								: inputValue
						}
						onChange={(e) => {
							if (!isRunning) {
								setInputValue(e.target.value);
							}
						}}
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

					{/* Bottom row: App selector and buttons */}
					<div className="flex items-center justify-between mt-3">
						{/* Left side: App selector */}
						<div className="flex-1 max-w-[200px]">
							<Select
								options={appOptions}
								placeholder="Select an app..."
								value={selectedApp?.id}
								onValueChange={onAppSelect}
								disabled={isRunning}
								widthClassName="w-full"
							/>
						</div>

						{/* Right side: Attachment + Send buttons */}
						<div className="flex items-center gap-2">
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
			<div className="flex items-stretch gap-4 min-w-0 flex-1 overflow-hidden">
				{/* Main content: apps area */}
				<div className="relative flex-1 min-w-0 flex flex-col px-[24px] pt-[24px] overflow-hidden">
					{/* About Stage docs link */}
					<div className="absolute top-4 right-6">
						<DocsLink
							href="https://docs.giselles.ai/features/stage"
							target="_blank"
							rel="noopener noreferrer"
							tone="muted"
						>
							About Stage
						</DocsLink>
					</div>
					{/* Sticky top section: app info + chat input */}
					<div className="flex-shrink-0 space-y-6 pb-6">
						<StageTopCard
							selectedApp={selectedApp}
							runningApp={runningApp}
							runStatus={runStatus}
							onDeselect={() => setSelectedAppId(undefined)}
						/>

						{/* Chat-style input area */}
						<ChatInputArea
							selectedApp={selectedApp}
							apps={data.apps}
							onAppSelect={(appId) => setSelectedAppId(appId)}
							onSubmit={handleRunSubmit}
							isRunning={isRunning}
						/>
					</div>

					{/* Scrollable app sections */}
					<div className="relative flex-1 min-h-0">
						<div
							className="absolute inset-0 overflow-y-auto"
							style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
						>
							<div className="flex flex-col gap-8 w-full pb-8 pt-12">
								{/* Section 1: Sample apps from Giselle team */}
								<div className="flex flex-col">
									<h2 className="text-inverse text-[14px] max-w-[960px] mx-auto w-full text-center">
										Sample apps from Giselle team
									</h2>
									<div className="grid grid-cols-3 gap-3 pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
										<ActionCard
											icon={HeadphonesIcon}
											title="Customer Support"
											description="Answer customer inquiries and resolve issues"
											onClick={() => {
												// TODO: Set up app selection
											}}
										/>
										<ActionCard
											icon={UserIcon}
											title="Tech Support"
											description="Help with technical problems and troubleshooting"
											onClick={() => {
												// TODO: Set up app selection
											}}
										/>
										<ActionCard
											icon={UsersIcon}
											title="Product Manager"
											description="Plan features and prioritize product roadmap"
											onClick={() => {
												// TODO: Set up app selection
											}}
										/>
									</div>
								</div>

								{/* Section 2: Select an Apps to Run */}
								<div className="flex flex-col">
									<h2 className="text-inverse text-[14px] max-w-[960px] mx-auto w-full text-center">
										Select an Apps to Run
									</h2>
									{teamApps.length === 0 ? (
										<p className="text-sm text-muted-foreground max-w-[960px] mx-auto w-full">
											No apps available.
										</p>
									) : (
										<div
											className="flex gap-4 overflow-x-auto pt-4 pb-4 max-w-[960px] mx-auto w-full px-4"
											style={{
												scrollbarWidth: "none",
												msOverflowStyle: "none",
											}}
										>
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
									<h2 className="text-inverse text-[14px] max-w-[960px] mx-auto w-full text-center">
										Edit Apps in Studio
									</h2>
									{teamApps.length === 0 ? (
										<p className="text-sm text-muted-foreground max-w-[960px] mx-auto w-full">
											No apps found in Team apps.
										</p>
									) : (
										<div
											className="flex gap-4 overflow-x-auto pt-4 pb-4 max-w-[960px] mx-auto w-full px-4"
											style={{
												scrollbarWidth: "none",
												msOverflowStyle: "none",
											}}
										>
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
						{/* Top gradient fade */}
						<div
							className="pointer-events-none absolute inset-x-0 top-0 h-24"
							style={{
								background:
									"linear-gradient(to bottom, var(--color-background) 0%, transparent 100%)",
								maskImage:
									"linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
								WebkitMaskImage:
									"linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
							}}
						/>
						{/* Bottom gradient fade */}
						<div
							className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
							style={{
								background:
									"linear-gradient(to top, var(--color-background) 0%, transparent 100%)",
								maskImage:
									"linear-gradient(to top, black 0%, black 30%, transparent 100%)",
								WebkitMaskImage:
									"linear-gradient(to top, black 0%, black 30%, transparent 100%)",
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
