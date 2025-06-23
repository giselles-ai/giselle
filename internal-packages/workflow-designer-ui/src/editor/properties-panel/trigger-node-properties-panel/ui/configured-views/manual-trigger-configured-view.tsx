import type {
	FlowTriggerId,
	ManualTriggerParameter,
	TriggerNode,
} from "@giselle-sdk/data-type";
import { useTrigger } from "../../../../../hooks/use-trigger";

export function ManualTriggerConfiguredView({
	node,
}: {
	node: TriggerNode;
}) {
	const { isLoading, data, enableFlowTrigger, disableFlowTrigger } =
		useTrigger(node);
	if (isLoading) {
		return "Loading...";
	}
	if (data === undefined || data.configuration.provider !== "manual") {
		return "No Data";
	}

	return (
		<div className="flex flex-col gap-[17px] p-0">
			{data.configuration.event.parameters.length > 0 && (
				<div className="space-y-[4px]">
					<p className="text-[14px] py-[1.5px] text-white-400">Parameters</p>
					<div className="px-[16px] py-[9px] w-full bg-transparent">
						<div className="flex flex-col gap-[8px]">
							{data.configuration.event.parameters.map(
								(param: ManualTriggerParameter) => (
									<div
										key={param.id}
										className="flex items-center justify-between p-[8px] bg-white-900/10 rounded-[4px]"
									>
										<div className="flex items-center gap-[8px]">
											<span className="font-medium text-[14px]">
												{param.name}
											</span>
											<span className="text-[12px] text-black-500">
												{param.type}
												{param.required ? " (required)" : ""}
											</span>
										</div>
									</div>
								),
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
