"use client";

import { Button } from "@giselle-internal/ui/button";
import { Select } from "@giselle-internal/ui/select";
import type {
	FlowTrigger,
	FlowTriggerId,
	ParameterItem,
} from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import type { InferSelectModel } from "drizzle-orm";
import { useCallback, useMemo, useState } from "react";
import type { teams } from "@/drizzle";
import {
	createInputsFromTrigger,
	parseFormInputs,
	toParameterItems,
} from "./helpers";

type TeamId = InferSelectModel<typeof teams>["id"];
interface TeamOption {
	id: TeamId;
	label: string;
}

export interface FlowTriggerUIItem {
	id: FlowTriggerId;
	teamId: TeamId;
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
	const defaultTeamId = useMemo(() => teamOptions[0].id, [teamOptions]);
	const [selectedTeamId, setSelectedTeamId] = useState<TeamId>(defaultTeamId);
	const defaultSelectedFlowTriggerId = useMemo(
		() =>
			flowTriggers.find((flowTrigger) => flowTrigger.teamId === defaultTeamId)
				?.id,
		[flowTriggers, defaultTeamId],
	);
	const [selectedFlowTriggerId, setSelectedFlowTriggerId] = useState<
		FlowTriggerId | undefined
	>(defaultSelectedFlowTriggerId);

	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const filteredFlowTriggers = useMemo(
		() =>
			flowTriggers.filter(
				(flowTrigger) => flowTrigger.teamId === selectedTeamId,
			),
		[flowTriggers, selectedTeamId],
	);

	const inputs = useMemo(
		() =>
			createInputsFromTrigger(
				filteredFlowTriggers.find(
					(flowTrigger) => flowTrigger.id === selectedFlowTriggerId,
				)?.sdkData,
			),
		[selectedFlowTriggerId, filteredFlowTriggers],
	);

	const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
		async (e) => {
			e.preventDefault();
			if (selectedFlowTriggerId === undefined) {
				return;
			}
			const formData = new FormData(e.currentTarget);
			const { errors, values } = parseFormInputs(inputs, formData);

			if (Object.keys(errors).length > 0) {
				setValidationErrors(errors);
				return;
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
		},
		[
			inputs,
			performStageAction,
			selectedFlowTriggerId,
			selectedTeamId,
			filteredFlowTriggers,
		],
	);

	return (
		<form
			onSubmit={handleSubmit}
			className="max-w-[800px] mx-auto border border-border bg-panel-background rounded-[4px] p-4 text-[14px] text-text resize-none outline-none"
		>
			<div className="flex flex-col gap-[8px] mb-[8px]">
				{inputs.map((input) => {
					return (
						<fieldset key={input.name} className={clsx("grid gap-2")}>
							<label
								className="text-[14px] font-medium text-white-900"
								htmlFor={input.name}
							>
								{input.label}
								{input.required && <span className="text-red-500 ml-1">*</span>}
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
											: "border-border",
										"text-[14px]",
									)}
								/>
							)}
							{input.type === "multiline-text" && (
								<textarea
									name={input.name}
									id={input.name}
									className={clsx(
										"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
										"border-[1px]",
										validationErrors[input.name]
											? "border-error"
											: "border-border",
										"text-[14px]",
									)}
									rows={4}
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
											: "border-border",
										"text-[14px]",
									)}
								/>
							)}
							{validationErrors[input.name] && (
								<span className="text-error text-[12px] font-medium">
									{validationErrors[input.name]}
								</span>
							)}
						</fieldset>
					);
				})}
			</div>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 justify-center">
					<Select
						id="team"
						placeholder="Select team"
						options={teamOptions}
						renderOption={(o) => o.label}
						value={selectedTeamId}
						onValueChange={(value) => setSelectedTeamId(value as TeamId)}
					/>
					<Select
						id="flow"
						placeholder="Select flow"
						options={
							filteredFlowTriggers.length === 0
								? [
										{
											id: "no-flow",
											label: "No flows available",
										},
									]
								: filteredFlowTriggers.map((flowTrigger) => ({
										id: flowTrigger.id,
										label: flowTrigger.label,
									}))
						}
						renderOption={(o) => o.label}
						value={selectedFlowTriggerId}
						onValueChange={(value) => {
							const selectedFlowTrigger = filteredFlowTriggers.find(
								(flowTrigger) => flowTrigger.id === (value as FlowTriggerId),
							);
							if (selectedFlowTrigger === undefined) {
								return;
							}
							setSelectedFlowTriggerId(selectedFlowTrigger.id);
						}}
					/>
				</div>
				<Button variant="solid" size="large" type="submit">
					Start
				</Button>
			</div>
		</form>
	);
}
