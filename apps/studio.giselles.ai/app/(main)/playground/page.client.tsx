"use client";

import { AppIcon } from "@giselle-internal/ui/app-icon";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import type {
	GenerationContextInput,
	ParametersInput,
	TaskId,
} from "@giselles-ai/protocol";
import { PlayIcon, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
	use,
	useCallback,
	useEffect,
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

function IdleHintArrow({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="77"
			height="127"
			viewBox="0 0 77 127"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				d="M76.1042 19.8128C76.0142 15.4228 75.7242 10.9328 74.4342 6.70278C73.7942 4.59278 72.8942 2.57278 71.7242 0.70278C70.7042 -0.92722 68.1042 0.57278 69.1342 2.21278C73.5042 9.19278 73.1742 17.9128 73.1542 25.8428C73.1342 33.6228 72.5742 41.6928 67.9042 48.2128C63.9642 53.7128 57.9742 58.1928 51.6442 60.5628C51.0242 60.7928 50.3942 61.0028 49.7542 61.1928C49.8142 57.2328 49.7342 53.2428 49.4442 49.3128C49.1642 45.6428 48.5842 41.8528 46.7942 38.5828C45.0842 35.4528 42.1142 33.0028 38.5442 32.4028C34.9242 31.7928 31.1242 32.7628 28.2042 34.9828C21.7242 39.9128 21.4842 49.7528 25.9542 56.1028C30.3042 62.2828 38.3942 65.9428 45.9142 65.0528C46.1542 65.0228 46.3942 64.9828 46.6342 64.9528C46.2242 71.9128 44.7642 78.6428 40.9842 84.7228C38.7142 88.3728 35.9542 91.6728 33.1942 94.9628C30.7642 97.8628 28.3042 100.743 25.7142 103.503C20.6042 108.933 14.8342 114.093 7.86415 116.963C7.57415 117.083 7.27415 117.193 6.97415 117.303C9.59415 113.043 12.6742 109.073 16.1742 105.463C17.5142 104.073 15.4042 101.953 14.0542 103.343C9.63415 107.903 5.83415 113.033 2.76415 118.573C2.74415 118.573 2.71415 118.583 2.69415 118.593C1.69415 118.823 1.45415 119.763 1.73415 120.513C1.18415 121.583 0.644152 122.673 0.154152 123.773C-0.445848 125.093 0.804152 126.593 2.20415 125.823C8.80415 122.223 16.5242 120.763 23.9842 121.823C24.7942 121.933 25.5842 121.623 25.8342 120.773C26.0342 120.073 25.5842 119.043 24.7842 118.923C17.9442 117.953 11.0342 118.783 4.69415 121.343C4.72415 121.273 4.76415 121.213 4.79415 121.143C12.3642 119.053 18.8742 114.413 24.4842 109.013C27.5042 106.103 30.3042 102.973 33.0342 99.7828C35.9942 96.3228 38.9742 92.8528 41.6242 89.1528C44.3242 85.3728 46.5242 81.2828 47.8242 76.8128C49.0042 72.7628 49.5042 68.5328 49.6942 64.3228C55.7542 62.7428 61.3642 59.2428 65.8642 55.0128C68.5042 52.5328 70.8942 49.6428 72.5342 46.4028C74.5542 42.4128 75.4542 37.9828 75.8642 33.5628C76.2842 29.0028 76.2142 24.3828 76.1142 19.8128H76.1042ZM42.3742 62.1628C38.9942 61.9428 35.5942 60.5928 32.8042 58.7028C26.8942 54.7128 23.6042 46.4728 27.6042 39.9828C31.0242 34.4428 39.6042 33.3728 43.4942 38.9628C45.4042 41.7028 46.0542 45.1628 46.3542 48.4228C46.7142 52.3228 46.7542 56.2828 46.7542 60.1928C46.7542 60.7628 46.7542 61.3428 46.7342 61.9128C45.2942 62.1528 43.8342 62.2628 42.3642 62.1628H42.3742Z"
				fill="currentColor"
			/>
		</svg>
	);
}

const PLAYGROUND_HAS_RUN_ANY_APP_KEY = "giselle:playground:hasRunAnyApp";

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
			className="relative rounded-[10px] sm:rounded-xl border-[0.5px] border-blue-muted/40 bg-transparent px-4 py-3 flex flex-col gap-2 text-left transition-all duration-150 ease-out hover:bg-white/5"
			style={
				isSelected
					? {
							borderColor: "rgba(131,157,195,0.32)",
							boxShadow: "0 0 0 1px rgba(131,157,195,0.18)",
							backgroundColor: "rgba(131,157,195,0.06)",
						}
					: undefined
			}
			onClick={onClick}
		>
			{badgeType !== "your-team" ? (
				<span
					className="pointer-events-none absolute right-4 top-0 -translate-y-[6px] shrink-0 rounded-full px-[7px] py-[3px] text-[10px] sm:px-2 sm:py-[2px] sm:text-[11px] text-text/80"
					style={
						isSelected
							? {
									// Selected state: slightly darker tone around 505D7B
									backgroundColor: "rgba(80,93,123,1)",
								}
							: {
									// Unselected state: darker tone to reduce emphasis
									backgroundColor: "rgba(45,54,76,1)",
								}
					}
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
	const [interactionTick, setInteractionTick] = useState(0);
	const [hasRunAnyApp, setHasRunAnyApp] = useState(false);
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

	const markInteraction = useCallback(() => {
		setInteractionTick((prev) => prev + 1);
	}, []);

	useEffect(() => {
		try {
			setHasRunAnyApp(
				Boolean(window.localStorage.getItem(PLAYGROUND_HAS_RUN_ANY_APP_KEY)),
			);
		} catch {
			setHasRunAnyApp(true);
		}
	}, []);

	const handleRunSubmit = useCallback(
		(event: { inputs: GenerationContextInput[] }) => {
			if (!selectedApp) return;
			markInteraction();
			try {
				window.localStorage.setItem(PLAYGROUND_HAS_RUN_ANY_APP_KEY, "1");
				setHasRunAnyApp(true);
			} catch {
				setHasRunAnyApp(true);
			}
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
		[
			selectedApp,
			createAndStartTaskAction,
			router,
			showOverlay,
			hideOverlay,
			markInteraction,
		],
	);

	return (
		<div className="w-full flex flex-col">
			<div className="flex items-stretch gap-4 min-w-0">
				{/* Main content: apps area */}
				<div className="flex-1 min-w-0 flex flex-col px-4 sm:px-[24px] pt-[24px]">
					{/* Top section: app info + chat input */}
					<div
						className="relative space-y-4 pb-8"
						onPointerDownCapture={markInteraction}
						onKeyDownCapture={markInteraction}
						onFocusCapture={markInteraction}
					>
						<div className="relative flex w-full max-w-[960px] min-w-[320px] mx-auto flex-col overflow-visible">
							<div className="w-full flex justify-center items-center pt-1 pb-1 sm:pt-2 sm:pb-2">
								<div className="flex flex-col items-center relative w-full">
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
							interactionTick={interactionTick}
							hasRunAnyApp={hasRunAnyApp}
							renderIdleHint={({ isVisible }) => (
								<div
									className={`pointer-events-none absolute right-[-100px] top-[-12px] z-20 flex flex-col items-start text-left text-[#B8E8F4] origin-top-right rotate-[20deg] translate-y-[6px] transition-opacity duration-300 ease-out ${
										isVisible ? "opacity-100" : "opacity-0"
									}`}
									aria-hidden="true"
								>
									<span className="text-[12px] font-mono tracking-[0.02em]">
										Run a sample app.
									</span>
									<IdleHintArrow className="mt-2 h-[44px] w-[44px] text-[#B8E8F4]" />
								</div>
							)}
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
