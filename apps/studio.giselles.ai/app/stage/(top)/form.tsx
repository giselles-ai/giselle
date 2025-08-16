"use client";

import { Button } from "@giselle-internal/ui/button";
import { Select } from "@giselle-internal/ui/select";
import type { FlowTrigger, FlowTriggerId } from "@giselle-sdk/data-type";
import type { ParameterItem } from "@giselle-sdk/giselle";
import { SpinnerIcon } from "@giselles-ai/icons/spinner";
import clsx from "clsx/lite";
import type { InferSelectModel } from "drizzle-orm";
import { useSearchParams } from "next/navigation";
import {
	useActionState,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { teams } from "@/drizzle";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { CircularCarousel } from "./circular-carousel";
import {
	createInputsFromTrigger,
	parseFormInputs,
	toParameterItems,
} from "./helpers";

type TeamId = InferSelectModel<typeof teams>["id"];
interface TeamOption {
	value: TeamId;
	label: string;
	avatarUrl?: string;
}

type FilterType = "all" | "history" | "latest" | "favorites";
interface FilterOption {
	value: FilterType;
	label: string;
}

const filterOptions: FilterOption[] = [
	{ value: "all", label: "All" },
	{ value: "history", label: "History" },
	{ value: "latest", label: "Latest" },
	{ value: "favorites", label: "Favorites" },
];

export interface FlowTriggerUIItem {
	id: FlowTriggerId;
	teamId: TeamId;
	workspaceName: string;
	label: string;
	sdkData: FlowTrigger;
}

interface PerformStagePayloads {
	teamId: TeamId;
	flowTrigger: FlowTrigger;
	parameterItems: ParameterItem[];
}

type PerformStageAction = (payloads: PerformStagePayloads) => Promise<void>;

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

	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

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

	const inputs = useMemo(
		() =>
			createInputsFromTrigger(
				filteredFlowTriggers.find(
					(flowTrigger) => flowTrigger.id === selectedFlowTriggerId,
				)?.sdkData,
			),
		[selectedFlowTriggerId, filteredFlowTriggers],
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
		<div className="max-w-[800px] mx-auto space-y-0">
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
						options={filterOptions}
						renderOption={(o) => o.label}
						value={selectedFilter}
						onValueChange={(value) => setSelectedFilter(value as FilterType)}
					/>
				</div>
			</div>

			{/* App Selection Container */}
			<div className="mt-12">
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
			</div>
			{filteredFlowTriggers.length > 0 && (
				<form
					action={action}
					className="backdrop-blur-3xl rounded-2xl p-6 text-[14px] text-text resize-none outline-none relative"
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
							inputs.map((input) => {
								return (
									<fieldset key={input.name} className={clsx("grid gap-2")}>
										<label
											className="text-[14px] font-medium text-white-900"
											htmlFor={input.name}
										>
											{input.label}
											{input.required && (
												<span className="text-red-500 ml-1">*</span>
											)}
										</label>
										{input.type === "text" && (
											<input
												type="text"
												name={input.name}
												id={input.name}
												className={clsx(
													"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border",
													validationErrors[input.name]
														? "border-error"
														: "border-white/5",
													"text-[14px]",
												)}
												disabled={isPending}
											/>
										)}
										{input.type === "multiline-text" && (
											<textarea
												name={input.name}
												id={input.name}
												className={clsx(
													"w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
													"border-[1px]",
													validationErrors[input.name]
														? "border-error"
														: "border-white/5",
													"text-[14px]",
												)}
												rows={4}
												disabled={isPending}
											/>
										)}
										{input.type === "number" && (
											<input
												type="number"
												name={input.name}
												id={input.name}
												className={clsx(
													"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
													"border-[1px]",
													validationErrors[input.name]
														? "border-error"
														: "border-white/5",
													"text-[14px]",
												)}
												disabled={isPending}
											/>
										)}
										{validationErrors[input.name] && (
											<span className="text-error text-[12px] font-medium">
												{validationErrors[input.name]}
											</span>
										)}
									</fieldset>
								);
							})
						)}
					</div>
					{selectedFlowTriggerId !== undefined && (
						<div className="flex items-center justify-end gap-3">
							<Button
								variant="filled"
								size="large"
								type="submit"
								disabled={isPending}
								className="!bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700 [&_div]:text-[14px] [&_.size-[18px]]:text-[18px]"
								leftIcon={
									isPending && (
										<SpinnerIcon className="animate-follow-through-overlap-spin size-[18px]" />
									)
								}
							>
								{isPending ? "Setting the stage…" : "Start"}
							</Button>
						</div>
					)}
				</form>
			)}
		</div>
	);
}
