import type { FlowTriggerId } from "@giselle-sdk/data-type";
import { githubTriggerIdToLabel } from "@giselle-sdk/flow";
import { UserIcon } from "lucide-react";
import ClipboardButton from "../../../../../ui/clipboard-button";
import { useGitHubTrigger } from "../../../../lib/use-github-trigger";
import { GitHubRepositoryBlock } from "../";

export function GitHubTriggerConfiguredView({
	flowTriggerId,
}: {
	flowTriggerId: FlowTriggerId;
}) {
	const { isLoading, data, enableFlowTrigger, disableFlowTrigger } =
		useGitHubTrigger(flowTriggerId);
	if (isLoading) {
		return "Loading...";
	}
	if (data === undefined) {
		return "No Data";
	}

	return (
		<div className="flex flex-col gap-[16px] p-0 overflow-y-auto">
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">State</p>
				<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px]">
					<div className="flex gap-[6px]">
						{data.trigger.enable ? (
							<>
								<span>Enabled</span>
								<button
									type="button"
									onClick={disableFlowTrigger}
									className="text-blue-900 cursor-pointer outline-none hover:underline"
								>
									→ Disable
								</button>
							</>
						) : (
							<>
								<span>Disabled</span>
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
			{(data.trigger.configuration.event.id ===
				"github.issue_comment.created" ||
				data.trigger.configuration.event.id ===
					"github.pull_request_comment.created" ||
				data.trigger.configuration.event.id ===
					"github.pull_request_review_comment.created") && (
				<div>
					<div className="space-y-[4px]">
						<p className="text-[14px] py-[1.5px] text-white-400">Call sign</p>
						<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px] flex items-center gap-[8px]">
							<span>
								/{data.trigger.configuration.event.conditions.callsign}
							</span>
							<ClipboardButton
								text={`/${data.trigger.configuration.event.conditions.callsign}`}
								className="text-black-400 hover:text-black-300"
								sizeClassName="h-[16px] w-[16px]"
							/>
						</div>
					</div>
					<div className="border border-black-800 rounded-[4px] overflow-hidden ml-[16px] pointer-events-none">
						<div className="bg-black-850 p-[8px] border-b border-black-800">
							<h3 className="text-[14px] text-black-300">
								GitHub Usage Example
							</h3>
						</div>
						<div className="p-4 bg-[#0d1117] flex gap-[8px]">
							<div>
								<div className="rounded-full bg-black-800 p-[6px]">
									<UserIcon className="size-[18px]" />
								</div>
							</div>
							<div className="flex-1">
								<div className="flex items-start gap-3 mb-2">
									<h2 className="text-[16px]">Add a comment</h2>
								</div>
								<div className="border border-[#30363d] rounded-md overflow-hidden">
									{/* Tab Navigation */}
									<div className="border-b border-[#30363d] bg-[#161b22] flex">
										<div className="border-b-2 border-[#f78166] px-4 py-2 text-sm">
											Write
										</div>
										<div className="px-4 py-2 text-sm text-gray-400">
											Preview
										</div>
									</div>

									<div className="min-h-[150px] p-4 bg-[#0d1117] text-gray-400 border-b border-[#30363d]">
										/{data.trigger.configuration.event.conditions.callsign}{" "}
										[enter your request...]
									</div>

									<div className="flex items-center justify-end p-[6px] bg-[#161b22]">
										<div className="px-3 py-1.5 bg-[#238636] text-white text-sm rounded-md">
											Comment
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
