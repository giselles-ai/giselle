import type { Output, TriggerNode } from "@giselle-sdk/data-type";
import { type GitHubTriggerEventId, githubTriggers } from "@giselle-sdk/flow";
import { GitHubTriggerStatusBadge } from "../../../../../node/ui/github-trigger/status-badge";

interface TemplateConfiguredState {
	status: "template-configured";
	provider: "github";
	eventId: GitHubTriggerEventId;
	outputs: Output[];
	name: string;
	callsign?: string;
}

export function GitHubTriggerTemplateConfiguredView({
	node,
	onConnectRepository,
}: {
	node: TriggerNode;
	onConnectRepository: () => void;
}) {
	const state = node.content.state as TemplateConfiguredState;
	if (state.status !== "template-configured") {
		return null;
	}
	const event = githubTriggers[state.eventId];
	return (
		<div className="flex flex-col gap-4 p-0 px-1">
			<GitHubTriggerStatusBadge />
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">Event Type</p>
				<div className="text-white text-sm">{event.event.label}</div>
			</div>
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">Outputs</p>
				<ul className="list-disc list-inside text-white text-sm">
					{state.outputs.map((o) => (
						<li key={o.id}>{o.label}</li>
					))}
				</ul>
			</div>
			<button
				type="button"
				className="self-start bg-primary-900 hover:bg-primary-800 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors"
				onClick={onConnectRepository}
			>
				Connect repository
			</button>
		</div>
	);
}
