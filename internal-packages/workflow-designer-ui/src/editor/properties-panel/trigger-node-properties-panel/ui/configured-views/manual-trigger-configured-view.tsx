import type { TriggerNode } from "@giselle-ai/data-type";
import { SettingLabel } from "@giselle-internal/ui/setting-label";
import { useTrigger } from "../../../../../hooks/use-trigger";

export const ManualTriggerConfiguredView = ({
	node,
}: {
	node: TriggerNode;
}) => {
	const { isLoading, data } = useTrigger(node);

	if (isLoading) {
		return "Loading...";
	}
	if (data === undefined || data.configuration.provider !== "manual") {
		return "No Data";
	}

	const parameters = data.configuration.event.parameters;

	return (
		<div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
			{parameters.length > 0 && (
				<div className="space-y-[4px]">
					<SettingLabel className="py-[1.5px]">Output Parameter</SettingLabel>
					<div className="px-[4px] py-0 w-full bg-transparent text-[14px] mt-[8px]">
						<ul className="w-full flex flex-col gap-[12px]">
							{parameters.map((param) => (
								<li key={param.id}>
									<div className="flex items-center gap-[8px]">
										<span className="text-[14px]">{param.name}</span>
										<span className="text-[12px] text-info">{param.type}</span>
										{param.required && (
											<span className="bg-error/20 text-error text-[12px] font-medium px-[6px] py-[1px] rounded-full">
												required
											</span>
										)}
									</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</div>
	);
};
