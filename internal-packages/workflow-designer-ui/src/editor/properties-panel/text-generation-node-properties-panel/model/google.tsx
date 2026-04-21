import { Toggle } from "@giselle-internal/ui/toggle";
import { GoogleLanguageModelData } from "@giselles-ai/protocol";
import { useUsageLimits } from "@giselles-ai/react";
import { TemperatureSlider, TopPSlider } from "./shared-model-controls";

export function GoogleModelPanel({
	googleLanguageModel,
	onModelChange,
	onSearchGroundingConfigurationChange,
}: {
	googleLanguageModel: GoogleLanguageModelData;
	onModelChange: (changedValue: GoogleLanguageModelData) => void;
	onSearchGroundingConfigurationChange: (enabled: boolean) => void;
}) {
	useUsageLimits();

	const isSearchGroundingEnabled =
		googleLanguageModel.configurations.searchGrounding;

	return (
		<div className="flex flex-col gap-[16px]">
			<div>
				<div className="grid grid-cols-1 gap-[16px]">
					<TemperatureSlider
						labelClassName="text-[14px]"
						onModelChange={onModelChange}
						modelData={googleLanguageModel}
						parseModelData={GoogleLanguageModelData.parse}
					/>
					<TopPSlider
						labelClassName="text-[14px]"
						onModelChange={onModelChange}
						modelData={googleLanguageModel}
						parseModelData={GoogleLanguageModelData.parse}
					/>
				</div>
				<div className="mt-[16px] flex flex-col gap-[16px]">
					<Toggle
						name="searchGrounding"
						checked={isSearchGroundingEnabled}
						onCheckedChange={onSearchGroundingConfigurationChange}
					>
						<label htmlFor="searchGrounding" className="text-text text-[14px]">
							Search Grounding
						</label>
					</Toggle>
				</div>
			</div>
		</div>
	);
}
