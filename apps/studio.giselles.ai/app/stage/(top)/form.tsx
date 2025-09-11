"use client";

import { Select } from "@giselle-internal/ui/select";
import type { FlowTriggerId } from "@giselle-sdk/data-type";

import clsx from "clsx/lite";
import { X } from "lucide-react";

import { useActionState, useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { buttonVariants } from "../../(main)/settings/components/button";
import { AppIcon } from "./app-icon";
import { CircularCarousel } from "./circular-carousel";
import { FormInputRenderer } from "./form-input-renderer";
import {
	createInputsFromTrigger,
	parseFormInputs,
	toParameterItems,
} from "./helpers";
import { useUIState } from "./hooks/use-ui-state";
import { SettingsDialog } from "./settings-dialog";
import type {
	FlowTriggerUIItem,
	PerformStageAction,
	TeamId,
	TeamOption,
	ValidationErrors,
} from "./types";

function assertNonEmpty<T>(
	arr: readonly T[],
	msg: string,
): asserts arr is readonly [T, ...T[]] {
	if (arr.length === 0) throw new Error(msg);
}

/** FlowTrigger is essentially an app (we'll change other parts going forward) */
type AppId = FlowTriggerId;
type App = FlowTriggerUIItem;

const displayCategories = {
	all: { value: "all", label: "All" },
	history: { value: "history", label: "History" },
	latest: { value: "latest", label: "Latest" },
	favorites: { value: "favorites", label: "Favorites" },
} as const;

type DisplayCategory = keyof typeof displayCategories;

export function FormContainer({
	flowTriggers: propApps,
	teamOptions,
	performStageAction,
	defaultAppId: propDefaultAppId,
	...props
}: {
	teamOptions: TeamOption[];
	flowTriggers: FlowTriggerUIItem[];
	performStageAction: PerformStageAction;
	defaultTeamId?: TeamId;
	defaultAppId?: AppId;
}) {
	const defaultTeamId = useMemo(() => {
		if (props.defaultTeamId !== undefined) {
			return props.defaultTeamId;
		}
		assertNonEmpty(teamOptions, "No team options available");
		return teamOptions[0].value;
	}, [props.defaultTeamId, teamOptions]);
	const [teamId, setTeamId] = useState<TeamId>(defaultTeamId);
	const defaultAppId = useMemo(() => {
		if (propDefaultAppId !== undefined) {
			return propDefaultAppId;
		}
		const app = propApps.find((app) => app.teamId === teamId);
		return app?.id;
	}, [teamId, propApps, propDefaultAppId]);

	const [appId, setAppId] = useState<AppId | undefined>(defaultAppId);

	const handleTeamIdChange = useCallback(
		(newTeamId: TeamId) => {
			setTeamId(newTeamId);
			const app = propApps.find((app) => app.teamId === newTeamId);
			setAppId(app?.id);
		},
		[propApps],
	);

	const handleAppIdChange = useCallback((newAppId: AppId) => {
		setAppId(newAppId);
	}, []);

	// TODO: Add filtering logic in the future, currently UI only
	const [displayCategory, setDisplayCategory] =
		useState<DisplayCategory>("all");
	const handleDisplayCategoryChange = useCallback(
		(newCategory: DisplayCategory) => {
			setDisplayCategory(newCategory);
		},
		[],
	);

	const apps = useMemo(
		() => propApps.filter((app) => app.teamId === teamId),
		[propApps, teamId],
	);

	return (
		<Form
			teamOptions={teamOptions}
			teamId={teamId}
			onTeamIdChange={handleTeamIdChange}
			apps={apps}
			appId={appId}
			onAppIdChange={handleAppIdChange}
			displayCategory={displayCategory}
			onDisplayCategoryChange={handleDisplayCategoryChange}
			performStageAction={performStageAction}
		/>
	);
}

function Form({
	apps,
	appId,
	onAppIdChange,
	teamOptions,
	teamId,
	onTeamIdChange,
	displayCategory,
	onDisplayCategoryChange,
	performStageAction,
}: {
	teamId: TeamId;
	teamOptions: TeamOption[];
	onTeamIdChange: (teamId: TeamId) => void;
	appId: AppId | undefined;
	apps: App[];
	onAppIdChange: (appId: AppId) => void;
	displayCategory: DisplayCategory;
	onDisplayCategoryChange: (category: DisplayCategory) => void;
	performStageAction: PerformStageAction;
}) {
	const {
		isMobile,
		isCarouselView,
		setIsCarouselView,
		isSettingsModalOpen,
		setIsSettingsModalOpen,
	} = useUIState();

	const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
		{},
	);

	const teamOptionsWithIcons = useMemo(
		() =>
			teamOptions.map((team) => ({
				...team,
				icon: team.avatarUrl ? (
					<AvatarImage
						avatarUrl={team.avatarUrl}
						width={24}
						height={24}
						alt={team.label}
					/>
				) : undefined,
			})),
		[teamOptions],
	);

	const app = useMemo(() => {
		const app = apps.find((app) => app.id === appId);
		return app;
	}, [apps, appId]);
	const inputs = useMemo(() => createInputsFromTrigger(app?.sdkData), [app]);

	const formAction = useCallback(
		async (_prevState: unknown, formData: FormData) => {
			if (app === undefined) {
				return null;
			}
			const { errors, values } = parseFormInputs(inputs, formData);

			if (Object.keys(errors).length > 0) {
				setValidationErrors(errors);
				return null;
			}

			setValidationErrors({});

			await performStageAction({
				teamId,
				flowTrigger: app.sdkData,
				parameterItems: toParameterItems(inputs, values),
			});
			return null;
		},
		[inputs, performStageAction, teamId, app],
	);

	const [, action, isPending] = useActionState(formAction, null);

	return (
		<div
			className={clsx(
				"space-y-0 relative flex flex-col",
				isMobile ? "pt-12" : "",
				isCarouselView && isMobile
					? "h-auto max-h-full overflow-y-auto"
					: "h-full",
			)}
		>
			{/* Settings Icon */}
			{/*<button
				type="button"
				onClick={() => setIsSettingsModalOpen(true)}
				className={clsx(
					"absolute right-2 p-2 rounded-lg hover:bg-white/10 transition-colors z-20",
					isMobile ? "top-2" : "-top-16",
				)}
			>
				<Settings className="w-4 h-4 text-white-400" />
			</button>
*/}
			{/* Team Selection Container */}
			<div className="flex justify-center gap-2">
				<div
					style={
						{
							width: "fit-content",
							minWidth: "auto",
						} as React.CSSProperties
					}
				>
					<div className="team-select">
						<Select
							id="team"
							placeholder="Select team"
							options={teamOptionsWithIcons}
							renderOption={(o) => o.label}
							value={teamId}
							onValueChange={(value) => {
								onTeamIdChange(value as TeamId);
							}}
						/>
					</div>
				</div>
				<div className="filter-select">
					<Select
						id="filter"
						placeholder="Filter"
						options={Object.values(displayCategories)}
						value={displayCategory}
						onValueChange={(value) => {
							onDisplayCategoryChange(value as DisplayCategory);
						}}
					/>
				</div>
			</div>

			{/* Separator Line */}
			<div className="w-full h-px bg-white/10 mt-4 mb-4" />

			{/* App Selection Container */}
			<div className="mt-4 flex flex-col justify-start">
				{isCarouselView ? (
					<CircularCarousel
						items={apps.map((app) => ({
							id: app.id,
							name: app.workspaceName,
							profileImageUrl: undefined,
						}))}
						selectedId={appId}
						onItemSelect={(item) => {
							onAppIdChange(item.id as AppId);
						}}
					/>
				) : (
					<div className="w-full px-4 max-w-4xl mx-auto">
						{apps.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-white-400 text-sm">
									No apps available for the selected team
								</p>
							</div>
						) : (
							<div className="relative z-10">
								<div
									className={clsx(
										"grid grid-cols-2 gap-3 overflow-y-auto transition-all duration-300",
										"pb-40 max-h-[30vh] md:max-h-[60vh]",
									)}
								>
									{apps.map((app) => (
										<button
											key={app.id}
											type="button"
											onClick={() => {
												onAppIdChange(app.id);
											}}
											className={clsx(
												"group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer relative z-20 w-full text-left",
												appId === app.id
													? "bg-blue-500/10 border-blue-500/50"
													: "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
											)}
										>
											{/* Icon */}
											<div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-primary-100/20">
												<AppIcon className="h-6 w-6 text-white/40 transition-colors group-hover:text-primary-100" />
											</div>
											{/* Content */}
											<div className="flex flex-col gap-y-1 min-w-0 flex-1">
												<p
													className={clsx(
														"text-[14px] font-sans truncate",
														appId === app.id
															? "text-blue-400"
															: "text-white-900",
													)}
												>
													{app.workspaceName || "Untitled"}
												</p>
												{app.label && app.label !== "Manual Trigger" && (
													<p className="text-[12px] font-geist text-white-400 truncate">
														{app.label}
													</p>
												)}
											</div>
										</button>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Slide-up Modal */}
			{!isCarouselView && app && (
				<div className="fixed inset-x-0 bottom-0 md:absolute md:left-0 md:right-0 z-50 animate-in slide-in-from-bottom-full duration-300">
					<div className="relative z-10 rounded-t-2xl shadow-xl focus:outline-none">
						<div
							className="absolute inset-0 -z-10 backdrop-blur-md rounded-t-2xl"
							style={{
								background:
									"linear-gradient(135deg, rgba(150, 150, 150, 0.03) 0%, rgba(60, 90, 160, 0.12) 100%)",
							}}
						/>
						<div className="absolute -z-10 top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
						<div className="absolute -z-10 inset-0 border border-white/10 rounded-t-2xl" />
						<div className="flex items-center justify-between mb-4 px-6 pt-6">
							<div className="flex items-center gap-3">
								{/* App Thumbnail */}
								<div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
									<AppIcon className="h-6 w-6 text-white/40" />
								</div>
								{/* App Title */}
								<div className="flex flex-col">
									<h3 className="font-sans text-[16px] font-medium tracking-tight text-white-100">
										{app.workspaceName || "Untitled"}
									</h3>
									{app.label && app.label !== "Manual Trigger" && (
										<p className="text-[12px] text-white-400 font-geist">
											{app.label}
										</p>
									)}
								</div>
							</div>
							<button
								type="button"
								className="rounded-full p-2 text-white-400 opacity-70 hover:opacity-100 hover:bg-white/10 focus:outline-none transition-all"
							>
								<X className="h-5 w-5" />
								<span className="sr-only">Close</span>
							</button>
						</div>

						<form action={action} className="text-[14px] px-6 pb-8">
							<FormInputRenderer
								inputs={inputs}
								validationErrors={validationErrors}
								isPending={isPending}
							/>
							<div className="mt-6 flex justify-end gap-x-3 pb-6">
								<button
									type="button"
									disabled={isPending}
									className={cn(buttonVariants({ variant: "link" }))}
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isPending}
									className={cn(
										buttonVariants({ variant: "primary" }),
										"whitespace-nowrap",
									)}
								>
									{isPending ? "Setting the stage…" : "Start"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{isCarouselView && apps.length > 0 && (
				<form
					action={action}
					className="backdrop-blur-3xl rounded-2xl p-6 text-[14px] text-text resize-none outline-none relative mb-28 md:mb-0"
					style={{
						backgroundColor: "rgba(255, 255, 255, 0.05)",
						boxShadow: `
				              0 4px 16px rgba(0, 0, 0, 0.1),
				              0 1px 4px rgba(0, 0, 0, 0.05),
				              inset 0 1px 0 rgba(255, 255, 255, 0.03)
				            `,
					}}
				>
					<div
						className="absolute inset-x-0 bottom-0 h-[1px] rounded-b-2xl"
						style={{
							background:
								"linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent)",
						}}
					/>
					<div className="flex flex-col gap-[8px] mb-[8px]">
						<FormInputRenderer
							inputs={inputs}
							validationErrors={validationErrors}
							isPending={isPending}
						/>
					</div>
					<div className="flex justify-end gap-x-3">
						<button
							type="submit"
							disabled={isPending}
							className={cn(
								buttonVariants({ variant: "primary" }),
								"whitespace-nowrap",
							)}
						>
							{isPending ? "Setting the stage…" : "Start"}
						</button>
					</div>
				</form>
			)}

			<SettingsDialog
				isOpen={isSettingsModalOpen}
				onOpenChange={setIsSettingsModalOpen}
				isMobile={isMobile}
				isCarouselView={isCarouselView}
				setIsCarouselView={setIsCarouselView}
			/>
		</div>
	);
}
