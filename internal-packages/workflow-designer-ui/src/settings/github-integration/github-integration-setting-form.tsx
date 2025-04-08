"use client";

import type { WorkspaceGitHubNextIntegrationAction } from "@giselle-sdk/data-type";
import {
	WorkspaceGitHubIntegrationNextAction,
	WorkspaceGitHubIntegrationPayloadField,
	type WorkspaceGitHubIntegrationPayloadNodeMap,
	WorkspaceGitHubIntegrationTrigger,
} from "@giselle-sdk/data-type";
import type { InstallationWithRepositories } from "@giselle-sdk/integration";
import { useIntegration } from "@giselle-sdk/integration/react";
import { useGiselleEngine, useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Label,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "../ui";
import { PayloadMapForm } from "./payload-map-form";
import { useGitHubIntegrationSetting } from "./use-github-integration-setting";

const NEXT_ACTION_DISPLAY_NAMES: Record<
	WorkspaceGitHubNextIntegrationAction,
	string
> = {
	"github.issue_comment.create": "Create Issue Comment",
	"github.pull_request_comment.create": "Create Pull Request Comment",
} as const;

const TRIGGER_TO_ACTIONS: Record<
	WorkspaceGitHubIntegrationTrigger,
	WorkspaceGitHubNextIntegrationAction[]
> = {
	"github.issues.opened": ["github.issue_comment.create"],
	"github.issue_comment.created": ["github.issue_comment.create"],
	"github.pull_request_comment.created": ["github.pull_request_comment.create"],
	"github.issues.closed": ["github.issue_comment.create"],
	"github.pull_request.opened": ["github.pull_request_comment.create"],
	"github.pull_request.ready_for_review": [
		"github.pull_request_comment.create",
	],
	"github.pull_request.closed": ["github.pull_request_comment.create"],
} as const;

const TRIGGERS_REQUIRING_CALLSIGN: readonly WorkspaceGitHubIntegrationTrigger[] =
	[
		"github.issue_comment.created",
		"github.pull_request_comment.created",
	] as const;

type TriggerRequiringCallsign = (typeof TRIGGERS_REQUIRING_CALLSIGN)[number];

const isTriggerRequiringCallsign = (
	trigger: WorkspaceGitHubIntegrationTrigger,
): trigger is TriggerRequiringCallsign => {
	return TRIGGERS_REQUIRING_CALLSIGN.includes(trigger);
};

const getAvailablePayloadFields = (
	trigger: WorkspaceGitHubIntegrationTrigger,
) => {
	const fields = Object.values(WorkspaceGitHubIntegrationPayloadField.Enum);
	const triggerParts = trigger.split(".");
	const triggerPrefix = `${triggerParts[0]}.${triggerParts[1]}.`;
	return fields.filter((field) => field.startsWith(triggerPrefix));
};

const getAvailableNextActions = (
	trigger: WorkspaceGitHubIntegrationTrigger,
) => {
	return TRIGGER_TO_ACTIONS[trigger] ?? [];
};

export function GitHubIntegrationSettingForm() {
	const { value } = useIntegration();
	const githubIntegration = useMemo(
		() => value.find((v) => v.provider === "github"),
		[value],
	);
	const client = useGiselleEngine();
	const [installations, setInstallations] = useState<
		InstallationWithRepositories[]
	>([]);
	useEffect(() => {
		if (githubIntegration === undefined) {
			return;
		}

		client
			.getInstallationRepositories({
				installationIds: githubIntegration.integrationIds,
			})
			.then((res) => setInstallations(res));
	}, [client, githubIntegration]);

	if (githubIntegration === undefined) {
		/** @todo ui for app/playground */
		return <div>No settings</div>;
	}

	return <Installed installations={installations} />;
}

function Installed({
	installations,
}: { installations: InstallationWithRepositories[] }) {
	const { data: workspace } = useWorkflowDesigner();
	const { isLoading, data, handleSubmit } = useGitHubIntegrationSetting();
	const [selectedTrigger, setSelectedTrigger] = useState<
		WorkspaceGitHubIntegrationTrigger | undefined
	>(data?.event);
	const [callsign, setCallsign] = useState(data?.callsign || "");
	const [selectedNextAction, setSelectedNextAction] = useState<
		WorkspaceGitHubNextIntegrationAction | undefined
	>(data?.nextAction);
	const [payloadMaps, setPayloadMaps] = useState<
		WorkspaceGitHubIntegrationPayloadNodeMap[]
	>(data?.payloadMaps || []);

	// Select component doesn't support resetting the value to undefined
	// So we need to use a workaround
	// https://github.com/radix-ui/primitives/issues/1569
	// https://github.com/shadcn-ui/ui/discussions/638
	const [nextActionKey, setNextActionKey] = useState(0);
	const resetSelectedNextAction = useCallback(() => {
		setSelectedNextAction(undefined);
		setNextActionKey((prev) => prev + 1);
	}, []);

	useEffect(() => {
		if (data) {
			setSelectedTrigger(data.event);
			setCallsign(data.callsign || "");
			setSelectedNextAction(data.nextAction);
			setPayloadMaps(data.payloadMaps || []);
		}
	}, [data]);

	const handleTriggerChange = useCallback(
		(value: string) => {
			const newTrigger = WorkspaceGitHubIntegrationTrigger.safeParse(value);
			if (!newTrigger.success) {
				setSelectedTrigger(undefined);
				setCallsign("");
				setPayloadMaps([]);
				resetSelectedNextAction();
				return;
			}

			const newTriggerValue = newTrigger.data;
			const currentTrigger = selectedTrigger;
			setSelectedTrigger(newTriggerValue);

			if (newTriggerValue !== currentTrigger) {
				if (!isTriggerRequiringCallsign(newTriggerValue)) {
					setCallsign("");
				}

				const availableActions = getAvailableNextActions(newTriggerValue);
				if (
					selectedNextAction &&
					!availableActions.includes(selectedNextAction)
				) {
					resetSelectedNextAction();
				}
			}
		},
		[selectedTrigger, selectedNextAction, resetSelectedNextAction],
	);
	const availablePayloadFields = useMemo(
		() => (selectedTrigger ? getAvailablePayloadFields(selectedTrigger) : []),
		[selectedTrigger],
	);
	const availableNextActions = useMemo(
		() => (selectedTrigger ? getAvailableNextActions(selectedTrigger) : []),
		[selectedTrigger],
	);

	if (isLoading) {
		return null;
	}

	return (
		<div className="flex flex-col gap-[16px]">
			<h2 className="text-[14px] font-accent font-[700] text-white-400">
				GitHub Integration
			</h2>
			<form className="w-full flex flex-col gap-[16px]" onSubmit={handleSubmit}>
				<div className="grid grid-cols-[140px_1fr] gap-x-[4px] gap-y-[16px]">
					<h3 className="relative font-accent text-white-400 text-[14px] flex items-center font-bold">
						Repository
					</h3>
					<div>
						<fieldset className="flex flex-col gap-[4px]">
							<Select
								defaultValue={data?.repositoryNodeId}
								name="repositoryNodeId"
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a repository" />
								</SelectTrigger>
								<SelectContent>
									{installations.map((installation) => (
										<SelectGroup key={installation.id}>
											<SelectLabel>
												{"login" in installation.account
													? installation.account.login
													: installation.account.name || ""}
											</SelectLabel>
											{installation.repositories.map((repository) => (
												<SelectItem
													key={repository.id}
													value={repository.node_id}
												>
													{repository.full_name}
												</SelectItem>
											))}
										</SelectGroup>
									))}
								</SelectContent>
							</Select>
						</fieldset>
					</div>
					<h3 className="font-accent text-white-400 text-[14px] font-bold">
						<div className="flex items-center">Trigger</div>
					</h3>
					<div className="flex flex-col gap-[16px]">
						<fieldset className="flex flex-col gap-[4px]">
							<Label>Event</Label>
							<Select
								name="event"
								defaultValue={data?.event}
								onValueChange={handleTriggerChange}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a trigger" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.issues.opened"
											]
										}
									>
										issues.opened
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.issues.closed"
											]
										}
									>
										issues.closed
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.issue_comment.created"
											]
										}
									>
										issue_comment.created
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.pull_request.opened"
											]
										}
									>
										pull_request.opened
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.pull_request.ready_for_review"
											]
										}
									>
										pull_request.ready_for_review
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.pull_request.closed"
											]
										}
									>
										pull_request.closed
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationTrigger.Enum[
												"github.pull_request_comment.created"
											]
										}
									>
										pull_request_comment.created
									</SelectItem>
								</SelectContent>
							</Select>
						</fieldset>
						{selectedTrigger && isTriggerRequiringCallsign(selectedTrigger) && (
							<fieldset className="flex flex-col gap-[4px]">
								<Label>Callsign</Label>
								<input
									type="text"
									name="callsign"
									className="bg-black-750 h-[28px] border-[1px] border-white-950/10 flex items-center px-[12px] text-[12px] rounded-[8px] outline-none placeholder:text-white-400/70"
									value={callsign}
									onChange={(e) => setCallsign(e.target.value)}
								/>
							</fieldset>
						)}
					</div>
					<h3 className="font-accent text-white-400 text-[14px] font-bold">
						Data mapping
					</h3>
					<div>
						<PayloadMapForm
							nodes={workspace.nodes}
							currentPayloadMaps={payloadMaps}
							availablePayloadFields={availablePayloadFields}
						/>
					</div>
					<h3 className="font-accent text-white-400 text-[14px] font-bold">
						Then
					</h3>
					<fieldset className="flex flex-col gap-[4px]">
						<Select
							key={nextActionKey}
							name="nextAction"
							value={selectedNextAction}
							onValueChange={(value) => {
								const nextAction =
									WorkspaceGitHubIntegrationNextAction.safeParse(value);
								if (nextAction.success) {
									setSelectedNextAction(nextAction.data);
								} else {
									resetSelectedNextAction();
								}
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select an action" />
							</SelectTrigger>
							<SelectContent>
								{availableNextActions.map((action) => (
									<SelectItem key={action} value={action}>
										{NEXT_ACTION_DISPLAY_NAMES[action]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</fieldset>
				</div>
				<div className="flex justify-end">
					<button
						type="submit"
						className="h-[28px] rounded-[8px] bg-white-800 text-[14px] cursor-pointer text-black-800 font-[700] px-[16px] font-accent"
					>
						Save
					</button>
				</div>
			</form>
		</div>
	);
}
