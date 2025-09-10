import type { FlowTriggerId } from "@giselle-sdk/data-type";
import clsx from "clsx";
import { Circle } from "lucide-react";
import { useGitHubTrigger } from "../../../lib/use-github-trigger";

export function GitHubTriggerStatusBadge({
	flowTriggerId,
}: {
	flowTriggerId: FlowTriggerId;
}) {
	const { isLoading, data } = useGitHubTrigger(flowTriggerId);

	if (isLoading && data === undefined) {
		return null;
	}
	if (data === undefined) {
		return null;
	}
	return (
		<div
			className="group flex items-center gap-[4px] text-gray-300 text-[10px] "
			data-enable={data.trigger.enable}
		>
			<Circle
				className={clsx(
					"size-[12px]",
					"group-data-[enable=false]:text-gray-500 group-data-[enable=false]:fill-gray-500",
					"group-data-[enable=true]:text-green-500 group-data-[enable=true]:fill-green-500",
				)}
			/>
			<span className="group-data-[enable=false]:hidden group-data-[enable=true]:block">
				Enabled
			</span>
			<span className="group-data-[enable=false]:block group-data-[enable=true]:hidden">
				Disabled
			</span>
		</div>
	);
}
