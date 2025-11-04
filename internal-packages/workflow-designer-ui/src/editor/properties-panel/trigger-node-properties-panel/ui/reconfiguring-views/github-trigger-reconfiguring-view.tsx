import type { FlowTriggerId, TriggerNode } from "@giselle-ai/data-type";
import type { GitHubIntegrationInstallation } from "@giselle-ai/giselle";
import { useGitHubTrigger } from "../../../../lib/use-github-trigger";
import {
	type GitHubTriggerReconfigureMode,
	Installed,
} from "../../providers/github-trigger/github-trigger-properties-panel";

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

	// Extract persisted callsign and labels from event if they exist
	const persistedCallsign =
		"conditions" in event && "callsign" in event.conditions
			? event.conditions.callsign
			: undefined;
	const persistedLabels =
		"conditions" in event && "labels" in event.conditions
			? event.conditions.labels
			: undefined;

	// Determine the appropriate reconfiguration step based on mode
	const reconfigStep = (() => {
		if (reconfigureMode === "callsign" && persistedCallsign !== undefined) {
			return {
				state: "input-callsign" as const,
				eventId: event.id,
				...repositoryInfo,
				callsign: persistedCallsign,
			};
		}

		if (reconfigureMode === "labels" && persistedLabels !== undefined) {
			return {
				state: "input-labels" as const,
				eventId: event.id,
				...repositoryInfo,
				labels: persistedLabels,
			};
		}

		// Default to repository selection
		return {
			state: "select-repository" as const,
			eventId: event.id,
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
