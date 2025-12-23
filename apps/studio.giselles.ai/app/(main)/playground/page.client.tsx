"use client";

import { AppIcon } from "@giselle-internal/ui/app-icon";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import type {
	GenerationContextInput,
	ParametersInput,
	TaskId,
} from "@giselles-ai/protocol";
import clsx from "clsx";
import { PlayIcon, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
	use,
	useCallback,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { useShallow } from "zustand/shallow";
import { useSelectedStageApp } from "@/app/(main)/stores/stage-app-selection-store";
import { useTaskOverlayStore } from "@/app/(main)/stores/task-overlay-store";
import { LLMProviderIcon } from "@/app/(main)/workspaces/components/llm-provider-icon";
import { PlaygroundStageInput } from "../components/stage-input/playground-stage-input";
import type { LoaderData } from "./data-loader";
import type { StageApp } from "./types";

type AppListCardBadgeType =
	| "sample"
	| "your-team"
	| "other-team"
	| "official"
	| "ambassador";

const APP_LIST_BADGE_CONFIG: Record<
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

interface AppListCardProps {
	title: string;
	description: string;
	badgeType: AppListCardBadgeType;
	iconName?: string;
	providers?: string[];
	icon?: ReactNode;
	creatorName?: string | null;
	isSelected?: boolean;
	onClick?: () => void;
}

function AppListCard({
	title,
	description,
	badgeType,
	providers,
	creatorName,
	isSelected = false,
	onClick,
}: AppListCardProps) {
	const { label } = APP_LIST_BADGE_CONFIG[badgeType];
	const visibleProviders = providers?.slice(0, 3) ?? [];
	const remainingProvidersCount =
		(providers?.length ?? 0) - visibleProviders.length;

	return (
		<button
			type="button"
			className={clsx(
				"relative rounded-[10px] sm:rounded-xl border-[0.5px] border-blue-muted/40 bg-transparent px-4 py-3 flex flex-col gap-2 text-left transition-all duration-150 ease-out hover:bg-white/5 outline-none",
				isSelected && [
					// Slightly brighter selected stroke
					"border-[rgba(177,204,255,0.45)]",
					// Keep layout stable: use ring instead of changing border width
					"ring-inset ring-[1.5px] ring-[rgba(177,204,255,0.45)]",
					"bg-[rgba(131,157,195,0.06)]",
					"shadow-[0_0_24px_rgba(0,135,246,0.18)]",
				],
			)}
			onClick={onClick}
		>
			{badgeType !== "your-team" ? (
				<span
					className={clsx(
						"pointer-events-none absolute right-4 top-0 -translate-y-[6px] shrink-0 rounded-full px-[7px] py-[3px] text-[10px] sm:px-2 sm:py-[2px] sm:text-[11px] text-text/80",
						isSelected ? "bg-[rgba(80,93,123,1)]" : "bg-[rgba(45,54,76,1)]",
					)}
				>
					{label}
				</span>
			) : null}
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-full bg-[rgba(21,25,33,0.7)] flex items-center justify-center shrink-0">
					<PlayIcon className="h-5 w-5 text-text-muted" />
				</div>
				<div className="flex items-center gap-2 min-w-0">
					<span className="font-medium text-[14px] truncate text-[color:var(--color-text-nav-active)]">
						{title}
					</span>
				</div>
			</div>
			{description.length > 0 ? (
				<span className="text-text-muted/70 text-[12px] leading-relaxed line-clamp-2">
					{description}
				</span>
			) : (
				<span className="text-text-muted/70 text-[12px] leading-relaxed invisible">
					placeholder
				</span>
			)}
			<div className="flex min-h-[28px] flex-col gap-0.5 mt-1">
				<div className="flex items-center gap-1">
					{visibleProviders.map((provider) => (
						<div
							key={provider}
							className="flex h-5 w-5 items-center justify-center rounded bg-white/5"
						>
							<LLMProviderIcon
								provider={provider}
								className="h-3 w-3 opacity-40"
							/>
						</div>
					))}
					{remainingProvidersCount > 0 ? (
						<span className="text-text/60 text-[11px]">
							+{remainingProvidersCount}
						</span>
					) : null}
					{(!providers || providers.length === 0) && (
						<span className="text-text/60 text-[11px] invisible">
							placeholder
						</span>
					)}
				</div>
				<span className="text-[11px] text-text-muted/70 py-[1px]">
					{creatorName ? `by ${creatorName}` : ""}
				</span>
			</div>
		</button>
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
	const badgeType: AppListCardBadgeType = app.isMine
		? "your-team"
		: "other-team";
	const creatorName = app.creator?.displayName;

	return (
		<AppListCard
			title={app.name}
			description={app.description}
			badgeType={badgeType}
			providers={app.llmProviders}
			creatorName={creatorName}
			isSelected={isSelected}
			onClick={onSelect}
		/>
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

	const router = useRouter();
	const [runningAppId, setRunningAppId] = useState<string | undefined>();
	const [isRunning, startTransition] = useTransition();
	const [appSearchQuery, setAppSearchQuery] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);
	const appSearchInputRef = useRef<HTMLInputElement | null>(null);
	const { showOverlay, hideOverlay } = useTaskOverlayStore(
		useShallow((state) => ({
			showOverlay: state.showOverlay,
			hideOverlay: state.hideOverlay,
		})),
	);

	const apps = useMemo(() => {
		const normalizedQuery = appSearchQuery.trim().toLowerCase();
		if (normalizedQuery.length === 0) {
			return data.apps;
		}
		return data.apps.filter((app) =>
			app.name.toLowerCase().includes(normalizedQuery),
		);
	}, [appSearchQuery, data.apps]);

	const selectableApps = useMemo(
		() => [...data.sampleApps, ...data.apps],
		[data.sampleApps, data.apps],
	);

	const { selectedAppId, selectedApp, setSelectedAppId } = useSelectedStageApp(
		"playground",
		selectableApps,
	);

	const handleRunSubmit = useCallback(
		(event: { inputs: GenerationContextInput[] }) => {
			if (!selectedApp) return;
			const parametersInput = event.inputs.find(
				(input): input is ParametersInput => input.type === "parameters",
			);
			showOverlay({
				app: {
					name: selectedApp.name,
					description: selectedApp.description,
					workspaceId: selectedApp.workspaceId,
				},
				input: parametersInput ?? null,
			});
			setRunningAppId(selectedApp.id);
			startTransition(async () => {
				try {
					const taskId = await createAndStartTaskAction({
						generationOriginType: "stage",
						nodeId: selectedApp.entryNodeId,
						inputs: event.inputs,
						workspaceId: selectedApp.workspaceId,
					});
					// Navigate to task page immediately when completed
					router.push(`/tasks/${taskId}`);
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error("Failed to create and start task from stage:", error);
					setRunningAppId(undefined);
					hideOverlay();
				}
			});
		},
		[selectedApp, createAndStartTaskAction, router, showOverlay, hideOverlay],
	);

	return (
		<div className="w-full flex flex-col">
			<div className="flex items-stretch gap-4 min-w-0">
				{/* Main content: apps area */}
				<div className="flex-1 min-w-0 flex flex-col px-4 sm:px-[24px] pt-[24px]">
					{/* Top section: app info + chat input */}
					<div className="space-y-4 pb-8">
						<div className="relative flex w-full max-w-[960px] min-w-[320px] mx-auto flex-col overflow-hidden">
							<div className="w-full flex justify-center items-center pt-1 pb-1 sm:pt-2 sm:pb-2">
								<div className="flex flex-col items-center relative">
									<p className="font-thin text-[36px] font-sans text-blue-muted/70 text-center">
										What's the task?
										<span className="block sm:inline">
											{" "}
											Your agent's on it.
										</span>
									</p>
								</div>
							</div>
						</div>

						{/* Chat-style input area */}
						<PlaygroundStageInput
							key={selectedApp?.workspaceId ?? "no-workspace"}
							apps={selectableApps}
							scope="playground"
							onSubmitAction={handleRunSubmit}
							isRunning={isRunning}
							shouldAutoFocus
						/>
					</div>

					{/* App sections */}
					<div className="flex flex-col gap-8 w-full pb-8 pt-12">
						{/* Section 1: Sample apps from Giselle team */}
						{data.sampleApps.length > 0 && (
							<div className="flex flex-col">
								<div className="flex items-center justify-between max-w-[960px] mx-auto w-full px-2">
									<h2 className="mt-1 text-[16px] text-text-muted/80">
										Sample apps from Giselle team
									</h2>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
									{data.sampleApps.map((sampleApp) => (
										<AppListCard
											key={sampleApp.id}
											title={sampleApp.name}
											description={sampleApp.description}
											badgeType="sample"
											icon={
												<AppIcon
													defaultSize={false}
													className="h-5 w-5 text-white/40"
												/>
											}
											providers={sampleApp.llmProviders}
											isSelected={
												selectedAppId === sampleApp.id ||
												runningAppId === sampleApp.id
											}
											onClick={() => {
												setSelectedAppId(sampleApp.id);
											}}
										/>
									))}
									{/*

									::::::::::: Sample implementations :::::::::

									<AppListCard
										title="Customer Support"
										description="A ready-made workflow that triages customer tickets, summarizes conversation history, and suggests high-quality replies for your support team."
										badgeType="sample"
										icon={
											<AppIcon
												defaultSize={false}
												className="h-5 w-5 text-white/40"
											/>
										}
										providers={["openai", "anthropic", "google", "perplexity"]}
									/>
									<AppListCard
										title="Tech Support"
										description="Handles bug reports, reproduces issues based on logs, and proposes potential fixes that engineers can review quickly."
										badgeType="sample"
										icon={
											<AppIcon
												defaultSize={false}
												className="h-5 w-5 text-white/40"
											/>
										}
										providers={["openai", "anthropic", "google"]}
									/>
									<AppListCard
										title="Product Manager"
										description="Aggregates user feedback, highlights trends, and drafts product requirement ideas your team can refine."
										badgeType="sample"
										icon={
											<AppIcon
												defaultSize={false}
												className="h-5 w-5 text-white/40"
											/>
										}
										providers={["openai", "anthropic"]}
									/>*/}
								</div>
							</div>
						)}

						{/* Section 2: Select an Apps to Run */}
						<div className="flex flex-col">
							<div className="flex items-center justify-between max-w-[960px] mx-auto w-full px-2">
								<h2 className="mt-1 text-[16px] text-text-muted/80">
									Select Your App to Run
								</h2>
								<div className="relative">
									{isSearchActive ? (
										<div className="flex items-center gap-2 rounded-[8px] bg-white/5 px-3 h-10 text-[13px] text-text border border-border transition-all duration-150">
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
												className="w-[160px] bg-transparent text-[13px] text-text placeholder:text-link-muted outline-none border-none"
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
											className="group flex items-center gap-2 rounded-[8px] px-3 h-10 text-[13px] text-text-muted transition-colors hover:bg-white/5"
										>
											<Search className="h-4 w-4 text-text-muted group-hover:text-text" />
											<span>Search apps</span>
										</button>
									)}
								</div>
							</div>
							{apps.length === 0 ? (
								<div className="pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
									<div className="w-full rounded-lg bg-[rgba(255,255,255,0.03)] shadow-[0_4px_16px_rgba(0,0,0,0.06)] px-6 py-6 text-center">
										<h3 className="flex items-center justify-center gap-2 text-[16px] font-medium text-blue-muted/80">
											<Sparkles className="h-4 w-4 text-blue-muted/80" />
											<span>No apps yet</span>
										</h3>
										<p className="mt-2 text-[13px] text-blue-muted/60 leading-relaxed">
											Build your first agent in Studio. Agents you create will
											appear here, ready to run in Stage.
										</p>
										<div className="mt-6 flex justify-center">
											<button
												type="button"
												onClick={() => {
													router.push("/workspaces");
												}}
												className="inline-flex items-center justify-center rounded-lg border border-[rgba(131,157,195,0.3)] px-4 py-2 text-[13px] text-[rgba(131,157,195,0.7)] transition-colors hover:border-[rgba(131,157,195,0.4)] hover:bg-[rgba(131,157,195,0.1)]"
											>
												Create your first app
											</button>
										</div>
									</div>
								</div>
							) : apps.length === 0 ? (
								<p className="text-sm text-muted-foreground max-w-[960px] mx-auto w-full">
									No apps match your search.
								</p>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 pb-4 max-w-[960px] mx-auto w-full px-4">
									{apps.map((app) => (
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
			</div>
		</div>
	);
}
