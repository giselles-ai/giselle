import type { GitHubTriggerEventId } from "@giselle-sdk/flow";
import { useCallback, useState } from "react";
import { isTriggerRequiringCallsign } from "../utils/trigger-configuration";

/**
 * Types for the different steps in trigger setup process
 */
export interface SelectEventStep {
	state: "select-event";
	selectedEventId?: GitHubTriggerEventId;
}

export interface SelectRepositoryStep {
	state: "select-repository";
	eventId: GitHubTriggerEventId;
}

export interface InputCallsignStep {
	state: "input-callsign";
	eventId: GitHubTriggerEventId;
	owner: string;
	repo: string;
	repoNodeId: string;
	installationId: number;
}

export type TriggerSetupStep =
	| SelectEventStep
	| SelectRepositoryStep
	| InputCallsignStep;

/**
 * Repository selection data
 */
export interface RepositorySelection {
	owner: string;
	repo: string;
	repoNodeId: string;
	installationId: number;
}

/**
 * Custom hook for managing trigger setup state
 */
export function useTriggerSetup(
	initialEventId: GitHubTriggerEventId = "github.issue.created",
) {
	// State for the current step in the setup process
	const [step, setStep] = useState<TriggerSetupStep>({
		state: "select-event",
	});

	// State for the selected event ID
	const [eventId, setEventId] = useState<GitHubTriggerEventId>(initialEventId);

	// Callback for selecting an event
	const selectEvent = useCallback((selectedEventId: GitHubTriggerEventId) => {
		setEventId(selectedEventId);
		setStep({
			state: "select-repository",
			eventId: selectedEventId,
		});
	}, []);

	// Callback for selecting a repository
	const selectRepository = useCallback(
		(repository: RepositorySelection) => {
			// If the event requires a callsign, go to callsign input step
			if (
				isTriggerRequiringCallsign(
					step.state === "select-repository" ? step.eventId : eventId,
				)
			) {
				setStep({
					state: "input-callsign",
					eventId: step.state === "select-repository" ? step.eventId : eventId,
					...repository,
				});
			} else {
				// Otherwise, return the repository selection and event ID for direct configuration
				return {
					eventId: step.state === "select-repository" ? step.eventId : eventId,
					...repository,
					requiresCallsign: false,
				};
			}
		},
		[step, eventId],
	);

	// Callback for completing callsign input
	const completeCallsignInput = useCallback(
		(callsign: string) => {
			if (step.state !== "input-callsign") {
				throw new Error(
					"Cannot complete callsign input: not in input-callsign state",
				);
			}

			return {
				eventId: step.eventId,
				owner: step.owner,
				repo: step.repo,
				repoNodeId: step.repoNodeId,
				installationId: step.installationId,
				callsign,
				requiresCallsign: true,
			};
		},
		[step],
	);

	// Callback for going back to the previous step
	const goBack = useCallback(() => {
		if (step.state === "select-repository") {
			setStep({ state: "select-event" });
		} else if (step.state === "input-callsign") {
			setStep({
				state: "select-repository",
				eventId: step.eventId,
			});
		}
	}, [step]);

	// Callback to reset the entire process
	const reset = useCallback(() => {
		setStep({ state: "select-event" });
		setEventId(initialEventId);
	}, [initialEventId]);

	return {
		step,
		eventId,
		selectEvent,
		selectRepository,
		completeCallsignInput,
		goBack,
		reset,
	};
}
