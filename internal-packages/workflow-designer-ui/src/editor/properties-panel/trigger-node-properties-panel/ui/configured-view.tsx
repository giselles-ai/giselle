import type { FlowTriggerId } from "@giselle-sdk/data-type";
import { githubTriggerIdToLabel } from "@giselle-sdk/flow";
import { useGitHubTrigger } from "../../../lib/use-github-trigger";
import { GitHubRepositoryBlock } from "./github-repository-block";

export function ConfiguredView({
	flowTriggerId,
}: {
	flowTriggerId: FlowTriggerId;
}) {
	const { isLoading, data } = useGitHubTrigger(flowTriggerId);
	if (isLoading) {
		return "loading...";
	}
	if (data === undefined) {
		return "no data";
	}

	return (
		<div className="flex flex-col gap-[17px] p-0">
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">Repository</p>
				<div className="px-[12px] pt-[6px]">
					<GitHubRepositoryBlock
						owner={data.githubRepositoryFullname.owner}
						repo={data.githubRepositoryFullname.repo}
					/>
				</div>
			</div>

			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">Event Type</p>
				<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px]">
					{githubTriggerIdToLabel(data.flowTrigger.configuration.event.id)}
				</div>
			</div>
			{data.flowTrigger.configuration.event.id ===
				"github.issue_comment.created" && (
				<div className="space-y-[4px]">
					<p className="text-[14px] py-[1.5px] text-white-400">Call sign</p>
					<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px]">
						{data.flowTrigger.configuration.event.conditions.callsign}
					</div>
				</div>
			)}
		</div>
	);
}
