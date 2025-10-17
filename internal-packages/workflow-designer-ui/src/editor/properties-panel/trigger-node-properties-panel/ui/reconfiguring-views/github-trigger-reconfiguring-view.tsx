import type { FlowTriggerId, TriggerNode } from "@giselle-sdk/data-type";
import type { GitHubIntegrationInstallation } from "@giselle-sdk/giselle";
import { useGitHubTrigger } from "../../../../lib/use-github-trigger";
import { Installed } from "../../providers/github-trigger/github-trigger-properties-panel";
import type { GitHubTriggerSetupStep } from "../../providers/github-trigger/utils/resolve-next-step";
import {
	extractCallsign,
	extractLabels,
	isTriggerRequiringCallsign,
	isTriggerRequiringLabels,
} from "../../providers/github-trigger/utils/trigger-configuration";
import type { GitHubTriggerReconfigureMode } from "../configured-views/github-trigger-configured-view";

export function GitHubTriggerReconfiguringView({
	installations,
	node,
	installationUrl,
	flowTriggerId,
	reconfigureMode,
}: {
	installations: GitHubIntegrationInstallation[];
	node: TriggerNode;
	installationUrl: string;
	flowTriggerId: FlowTriggerId;
	reconfigureMode?: GitHubTriggerReconfigureMode;
}) {
	const { isLoading, data } = useGitHubTrigger(flowTriggerId);
	if (isLoading) {
		return "Loading...";
	}
	if (data === undefined) {
		return "No Data";
	}
	if (
		node.content.state.status !== "reconfiguring" ||
		data.trigger.configuration.provider !== "github"
	) {
		return "Unexpected state";
	}

	const event = data.trigger.configuration.event;
	const repositoryInfo = {
		installationId: data.trigger.configuration.installationId,
		repoNodeId: data.trigger.configuration.repositoryNodeId,
		owner: data.githubRepositoryFullname.owner,
		repo: data.githubRepositoryFullname.repo,
	};
	const persistedCallsign = extractCallsign(event);
	const persistedLabels = extractLabels(event);

	const reconfigStep: GitHubTriggerSetupStep = (() => {
		if (
			reconfigureMode === "callsign" &&
			isTriggerRequiringCallsign(event.id) &&
			persistedCallsign
		) {
			return {
				state: "input-callsign",
				eventId: event.id,
				...repositoryInfo,
				callsign: persistedCallsign,
			};
		}
		if (
			reconfigureMode === "labels" &&
			isTriggerRequiringLabels(event.id) &&
			persistedLabels
		) {
			return {
				state: "input-labels",
				eventId: event.id,
				...repositoryInfo,
				labels: persistedLabels,
			};
		}
		return {
			state: "select-repository",
			eventId: event.id,
			callsign: persistedCallsign,
			labels: persistedLabels,
			installationId: repositoryInfo.installationId,
		};
	})();

	return (
		<Installed
			installations={installations}
			node={node}
			installationUrl={installationUrl}
			reconfigStep={reconfigStep}
			flowTriggerId={flowTriggerId}
		/>
	);
}
