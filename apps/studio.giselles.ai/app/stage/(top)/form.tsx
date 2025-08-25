"use client";

import { Select } from "@giselle-internal/ui/select";
import type { FlowTriggerId } from "@giselle-sdk/data-type";

import clsx from "clsx/lite";
import { Settings, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
	useActionState,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { cn } from "@/lib/utils";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { buttonVariants } from "../../(main)/settings/components/button";

import { CircularCarousel } from "./circular-carousel";
import { FormInputRenderer } from "./form-input-renderer";
import {
	createInputsFromTrigger,
	parseFormInputs,
	toParameterItems,
} from "./helpers";
import { SettingsDialog } from "./settings-dialog";
import type {
	FilterType,
	FlowTriggerUIItem,
	PerformStageAction,
	TeamId,
	TeamOption,
	ValidationErrors,
} from "./types";
import { FILTER_OPTIONS } from "./types";

// Reusable SVG icon component
const APP_ICON_SVG = (
	<svg
		role="img"
		aria-label="App icon"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 486 640"
		className="h-6 w-6 text-white/40 transition-colors group-hover:text-primary-100"
		fill="currentColor"
	>
		<title>App Icon</title>
		<path d="M278.186 397.523C241.056 392.676 201.368 394.115 171.855 391.185C142.556 387.776 131.742 363.167 136.856 355.603C158.378 364.712 177.928 368.547 201.794 368.387C241.642 368.227 275.576 356.242 303.544 332.486C331.511 308.729 345.362 280.285 344.936 247.207C342.912 222.545 327.782 184.194 293.742 157.188C290.971 154.791 283.673 150.583 283.673 150.583C258.635 135.615 230.188 128.318 198.438 128.69C170.843 130.129 149.747 135.509 126.574 143.711C73.0358 162.781 54.7103 208.589 55.243 249.018V249.924C63.1273 312.298 93.8652 328.757 125.935 351.342L88.1651 394.913L89.1772 400.613C89.1772 400.613 144.527 399.441 174.412 401.998C257.783 410.84 291.877 467.408 292.516 511.14C293.209 560.784 250.431 625.022 180.645 625.555C81.2397 626.354 78.5229 422.292 78.5229 422.292L0 504.215C2.6636 550.237 46.613 601.958 82.5182 617.938C130.356 636.847 187.251 632.107 211.969 629.603C237.486 627.046 363.368 607.072 379.136 498.143C379.136 467.302 358.041 407.964 278.186 397.523ZM266.093 226.433C279.678 277.302 283.14 315.334 263.749 345.27C250.538 359.598 229.868 364.872 209.199 363.114C206.535 362.901 179.207 358.267 162.746 322.685C179.26 301.272 218.522 250.563 255.599 204.222C260.66 209.814 266.093 226.487 266.093 226.487V226.433ZM136.643 152.607H136.536C149.534 135.935 185.44 129.916 203.392 135.349C221.771 144.404 235.515 161.023 250.645 192.769L196.201 261.909L156.62 312.245C150.333 300.633 144.58 286.997 140.158 271.337C120.927 203.103 123.484 170.877 136.589 152.607H136.643Z" />
		<path d="M370.506 0C370.506 55.3433 310.362 106.638 255.013 106.638C310.362 106.638 370.506 157.933 370.506 213.277C370.506 157.933 430.65 106.638 486 106.638C430.65 106.638 370.506 55.3433 370.506 0Z" />
	</svg>
);

export function Form({
	teamOptions,
	flowTriggers,
	performStageAction,
}: {
	teamOptions: TeamOption[];
	flowTriggers: FlowTriggerUIItem[];
	performStageAction: PerformStageAction;
}) {
	const searchParams = useSearchParams();
	const urlTeamId = searchParams.get("teamId");
	const urlWorkspaceId = searchParams.get("workspaceId");

	const defaultTeamId = useMemo(() => {
		if (urlTeamId && teamOptions.some((team) => team.value === urlTeamId)) {
			return urlTeamId as TeamId;
		}
		return teamOptions[0].value;
	}, [teamOptions, urlTeamId]);

	const [selectedTeamId, setSelectedTeamId] = useState<TeamId>(defaultTeamId);

	const [selectedFlowTriggerId, setSelectedFlowTriggerId] = useState<
		FlowTriggerId | undefined
	>(undefined);
	const initializedRef = useRef(false);
	const userHasSelectedRef = useRef(false);
	const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
	const [isCarouselView, setIsCarouselView] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
		{},
	);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, []);

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

	const filteredFlowTriggers = useMemo(
		() =>
			flowTriggers.filter(
				(flowTrigger) => flowTrigger.teamId === selectedTeamId,
			),
		[flowTriggers, selectedTeamId],
	);

	// Pre-select flow trigger based on URL workspace ID (only once on initial load and if user hasn't manually selected)
	useEffect(() => {
		if (
			!initializedRef.current &&
			!userHasSelectedRef.current &&
			filteredFlowTriggers.length > 0
		) {
			if (urlWorkspaceId) {
				const matchingTrigger = filteredFlowTriggers.find(
					(trigger) => trigger.sdkData.workspaceId === urlWorkspaceId,
				);
				if (matchingTrigger) {
					setSelectedFlowTriggerId(matchingTrigger.id);
					// Don't mark as user-selected for auto-selection from URL
				}
			}
			initializedRef.current = true;
		}
	}, [filteredFlowTriggers, urlWorkspaceId]);

	const selectedTrigger = useMemo(
		() =>
			filteredFlowTriggers.find(
				(flowTrigger) => flowTrigger.id === selectedFlowTriggerId,
			),
		[filteredFlowTriggers, selectedFlowTriggerId],
	);

	const inputs = useMemo(
		() => createInputsFromTrigger(selectedTrigger?.sdkData),
		[selectedTrigger],
	);

	const formAction = useCallback(
		async (_prevState: unknown, formData: FormData) => {
			if (selectedFlowTriggerId === undefined) {
				return null;
			}
			const { errors, values } = parseFormInputs(inputs, formData);

			if (Object.keys(errors).length > 0) {
				setValidationErrors(errors);
				return null;
			}

			setValidationErrors({});

			const flowTrigger = filteredFlowTriggers.find(
				(flowTrigger) => flowTrigger.id === selectedFlowTriggerId,
			);
			if (flowTrigger === undefined) {
				throw new Error(
					`Flow trigger with ID ${selectedFlowTriggerId} not found`,
				);
			}

			await performStageAction({
				teamId: selectedTeamId,
				flowTrigger: flowTrigger.sdkData,
				parameterItems: toParameterItems(inputs, values),
			});
			return null;
		},
		[
			inputs,
			performStageAction,
			selectedFlowTriggerId,
			selectedTeamId,
			filteredFlowTriggers,
		],
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
			<button
				type="button"
				onClick={() => setIsSettingsModalOpen(true)}
				className={clsx(
					"absolute right-2 p-2 rounded-lg hover:bg-white/10 transition-colors z-20",
					isMobile ? "top-2" : "-top-16",
				)}
			>
				<Settings className="w-4 h-4 text-white-400" />
			</button>

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
							value={selectedTeamId}
							onValueChange={(value) => {
								setSelectedTeamId(value as TeamId);
								userHasSelectedRef.current = true;
								setSelectedFlowTriggerId(undefined);
							}}
						/>
					</div>
				</div>
				<div className="filter-select">
					<Select
						id="filter"
						placeholder="Filter"
						options={FILTER_OPTIONS}
						renderOption={(o) => o.label}
						value={selectedFilter}
						onValueChange={(value) => setSelectedFilter(value as FilterType)}
					/>
				</div>
			</div>

			{/* Separator Line */}
			<div className="w-full h-px bg-white/10 mt-4 mb-4" />

			{/* App Selection Container */}
			<div className="mt-4 flex flex-col justify-start">
				{isCarouselView ? (
					<CircularCarousel
						items={filteredFlowTriggers.map((trigger) => ({
							id: trigger.id,
							name: trigger.workspaceName,
							profileImageUrl: undefined,
						}))}
						selectedId={selectedFlowTriggerId}
						onItemSelect={(item) => {
							userHasSelectedRef.current = true;
							setSelectedFlowTriggerId(item.id as FlowTriggerId);
						}}
						onItemDeselect={() => {
							userHasSelectedRef.current = true;
							setSelectedFlowTriggerId(undefined);
						}}
					/>
				) : (
					<div className="w-full px-4 max-w-4xl mx-auto">
						{filteredFlowTriggers.length === 0 ? (
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
										!isCarouselView && selectedFlowTriggerId !== undefined
											? "pb-40 max-h-[30vh] md:max-h-[60vh]"
											: "max-h-[50vh] md:max-h-[70vh] pb-28 md:pb-0",
									)}
								>
									{filteredFlowTriggers.map((trigger) => (
										<button
											key={trigger.id}
											type="button"
											onClick={() => {
												userHasSelectedRef.current = true;
												if (selectedFlowTriggerId === trigger.id) {
													setSelectedFlowTriggerId(undefined);
												} else {
													setSelectedFlowTriggerId(trigger.id);
												}
											}}
											className={clsx(
												"group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer relative z-20 w-full text-left",
												selectedFlowTriggerId === trigger.id
													? "bg-blue-500/10 border-blue-500/50"
													: "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
											)}
										>
											{/* Icon */}
											<div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-primary-100/20">
												{APP_ICON_SVG}
											</div>
											{/* Content */}
											<div className="flex flex-col gap-y-1 min-w-0 flex-1">
												<p
													className={clsx(
														"text-[14px] font-sans truncate",
														selectedFlowTriggerId === trigger.id
															? "text-blue-400"
															: "text-white-900",
													)}
												>
													{trigger.workspaceName || "Untitled"}
												</p>
												{trigger.label &&
													trigger.label !== "Manual Trigger" && (
														<p className="text-[12px] font-geist text-white-400 truncate">
															{trigger.label}
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
			{!isCarouselView && selectedFlowTriggerId !== undefined && (
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
									<div className="h-6 w-6 text-white/40">{APP_ICON_SVG}</div>
								</div>
								{/* App Title */}
								<div className="flex flex-col">
									<h3 className="font-sans text-[16px] font-medium tracking-tight text-white-100">
										{selectedTrigger?.workspaceName || "Untitled"}
									</h3>
									{selectedTrigger?.label &&
										selectedTrigger.label !== "Manual Trigger" && (
											<p className="text-[12px] text-white-400 font-geist">
												{selectedTrigger.label}
											</p>
										)}
								</div>
							</div>
							<button
								type="button"
								onClick={() => setSelectedFlowTriggerId(undefined)}
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
									onClick={() => setSelectedFlowTriggerId(undefined)}
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

			{isCarouselView && filteredFlowTriggers.length > 0 && (
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
						{selectedFlowTriggerId === undefined ? (
							<div className="text-center py-8">
								<p className="text-white-400 text-[14px] font-medium font-['DM_Sans']">
									Please select an app to execute
								</p>
							</div>
						) : (
							<FormInputRenderer
								inputs={inputs}
								validationErrors={validationErrors}
								isPending={isPending}
							/>
						)}
					</div>
					{selectedFlowTriggerId !== undefined && (
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
					)}
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
