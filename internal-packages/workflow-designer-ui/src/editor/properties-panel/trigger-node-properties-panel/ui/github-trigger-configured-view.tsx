import type { FlowTriggerId } from "@giselle-sdk/data-type";
import { githubTriggerIdToLabel } from "@giselle-sdk/flow";
import { useGitHubTrigger } from "../../../lib/use-github-trigger";
import { GitHubRepositoryBlock } from "../../ui";

export function GitHubTriggerConfiguredView({
	flowTriggerId,
}: {
	flowTriggerId: FlowTriggerId;
}) {
	const { isLoading, data, enableFlowTrigger, disableFlowTrigger } =
		useGitHubTrigger(flowTriggerId);
	if (isLoading) {
		return "loading...";
	}
	if (data === undefined) {
		return "no data";
	}

	return (
		<div className="flex flex-col gap-[17px] p-0">
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">State</p>
				<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px]">
					<div className="flex gap-[6px]">
						{data.trigger.enable ? (
							<>
								<span>Enable</span>
								<button
									type="button"
									onClick={disableFlowTrigger}
									className="text-blue-900 cursor-pointer outline-none hover:underline"
								>
									→ Disable Trigger
								</button>
							</>
						) : (
							<>
								<span>Disable</span>
								<button
									type="button"
									onClick={enableFlowTrigger}
									className="text-blue-900 cursor-pointer outline-none hover:underline"
								>
									→ Enable
								</button>
							</>
						)}
					</div>
				</div>
			</div>
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
					{githubTriggerIdToLabel(data.trigger.configuration.event.id)}
				</div>
			</div>
			{data.trigger.configuration.event.id ===
				"github.issue_comment.created" && (
				<div className="space-y-[4px]">
					<p className="text-[14px] py-[1.5px] text-white-400">Call sign</p>
					<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px]">
						{data.trigger.configuration.event.conditions.callsign}
					</div>
				</div>
			)}
		</div>
	);
}
