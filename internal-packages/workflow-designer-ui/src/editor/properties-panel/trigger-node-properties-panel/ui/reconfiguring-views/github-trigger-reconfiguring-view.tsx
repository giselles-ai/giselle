import type { FlowTriggerId, TriggerNode } from "@giselle-sdk/data-type";
import type { GitHubIntegrationInstallation } from "@giselle-sdk/giselle";
import { useGitHubTrigger } from "../../../../lib/use-github-trigger";
import { Installed } from "../../providers/github-trigger/github-trigger-properties-panel";

export function GitHubTriggerReconfiguringView({
	installations,
	node,
	installationUrl,
	flowTriggerId,
}: {
	installations: GitHubIntegrationInstallation[];
	node: TriggerNode;
	installationUrl: string;
	flowTriggerId: FlowTriggerId;
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

	const reconfigStep = {
		state: "select-repository" as const,
		eventId: data.trigger.configuration.event.id,
	};

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
