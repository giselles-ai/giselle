import type {
	GitHubFlowTriggerEvent,
	TriggerNode,
} from "@giselle-sdk/data-type";
import type { GitHubTriggerEventId } from "@giselle-sdk/flow";
import {
	createTriggerEvent,
	isTriggerRequiringCallsign,
	isTriggerRequiringLabels,
} from "./trigger-configuration";

interface SelectEvent {
	state: "select-event";
	eventId: GitHubTriggerEventId;
}
interface SelectRepositoryStep {
	state: "select-repository";
	eventId: GitHubTriggerEventId;
	callsign?: string;
	labels?: string[];
	installationId?: number;
}
interface InputCallsignStep {
	state: "input-callsign";
	eventId: GitHubTriggerEventId;
	owner: string;
	repo: string;
	repoNodeId: string;
	installationId: number;
	callsign?: string;
}
interface InputLabelsStep {
	state: "input-labels";
	eventId: GitHubTriggerEventId;
	owner: string;
	repo: string;
	repoNodeId: string;
	installationId: number;
	labels?: string[];
	callsign?: string;
}
interface ConfirmRepositoryStep {
	state: "confirm-repository";
	eventId: GitHubTriggerEventId;
	installationId: number;
	owner: string;
	repo: string;
	repoNodeId: string;
	callsign?: string;
	labels?: string[];
}

export type GitHubTriggerSetupStep =
	| SelectEvent
	| SelectRepositoryStep
	| InputCallsignStep
	| InputLabelsStep
	| ConfirmRepositoryStep;

export interface RepositoryInfo {
	installationId: number;
	repoNodeId: string;
	owner: string;
	repo: string;
}

type StepAction =
	| {
			type: "continue";
			nextStep: GitHubTriggerSetupStep;
	  }
	| {
			type: "submit";
			event: GitHubFlowTriggerEvent;
			repositoryInfo: RepositoryInfo;
	  };

interface StepSubmissionData {
	callsign?: string;
	labels?: string[];
}

interface resolveNextStepProps {
	currentStep: GitHubTriggerSetupStep;
	eventId: GitHubTriggerEventId;
	submissionData: StepSubmissionData;
	nodeStatus: TriggerNode["content"]["state"]["status"];
}

export function resolveNextStep({
	currentStep,
	eventId,
	submissionData,
	nodeStatus,
}: resolveNextStepProps): StepAction {
	switch (currentStep.state) {
		case "confirm-repository": {
			const repositoryInfo = {
				installationId: currentStep.installationId,
				owner: currentStep.owner,
				repo: currentStep.repo,
				repoNodeId: currentStep.repoNodeId,
			} satisfies RepositoryInfo;
			const persistedCallsign = currentStep.callsign;
			const persistedLabels = currentStep.labels;

			const inputCallsignStep = {
				state: "input-callsign",
				eventId,
				...repositoryInfo,
				callsign: persistedCallsign,
			} satisfies InputCallsignStep;

			const inputLabelsStep = {
				state: "input-labels",
				eventId,
				...repositoryInfo,
				labels: persistedLabels,
			} satisfies InputLabelsStep;

			if (
				isTriggerRequiringCallsign(eventId) &&
				nodeStatus === "unconfigured"
			) {
				return {
					type: "continue",
					nextStep: inputCallsignStep,
				};
			}
			if (isTriggerRequiringLabels(eventId) && nodeStatus === "unconfigured") {
				return {
					type: "continue",
					nextStep: inputLabelsStep,
				};
			}

			return {
				type: "submit",
				event: createTriggerEvent({
					eventId,
					callsign: submissionData.callsign ?? persistedCallsign,
					labels: submissionData.labels ?? persistedLabels,
				}),
				repositoryInfo,
			};
		}

		case "input-callsign": {
			return {
				type: "submit",
				event: createTriggerEvent({
					eventId,
					callsign: submissionData.callsign,
				}),
				repositoryInfo: {
					installationId: currentStep.installationId,
					repoNodeId: currentStep.repoNodeId,
					owner: currentStep.owner,
					repo: currentStep.repo,
				} satisfies RepositoryInfo,
			};
		}

		case "input-labels": {
			return {
				type: "submit",
				event: createTriggerEvent({ eventId, labels: submissionData.labels }),
				repositoryInfo: {
					installationId: currentStep.installationId,
					repoNodeId: currentStep.repoNodeId,
					owner: currentStep.owner,
					repo: currentStep.repo,
				} satisfies RepositoryInfo,
			};
		}

		default:
			throw new Error(
				`Cannot process submission for step: ${currentStep.state}`,
			);
	}
}
