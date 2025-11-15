import { Toggle } from "@giselle-internal/ui/toggle";
import { useFeatureFlag, useUsageLimits } from "@giselles-ai/react";
import { GoogleLanguageModelData } from "@giselles-ai/protocol";
import { InfoIcon } from "lucide-react";
import { TemperatureSlider, TopPSlider } from "./shared-model-controls";

export function GoogleModelPanel({
	googleLanguageModel,
	onModelChange,
	onSearchGroundingConfigurationChange,
	onUrlContextConfigurationChange,
}: {
	googleLanguageModel: GoogleLanguageModelData;
	onModelChange: (changedValue: GoogleLanguageModelData) => void;
	onSearchGroundingConfigurationChange: (enabled: boolean) => void;
	onUrlContextConfigurationChange: (enabled: boolean) => void;
}) {
	useUsageLimits();
	const { googleUrlContext } = useFeatureFlag();

	const isSearchGroundingEnabled =
		googleLanguageModel.configurations.searchGrounding;
	const isUrlContextEnabled =
		googleUrlContext &&
		(googleLanguageModel.configurations.urlContext ?? false);
	const shouldShowMutualExclusionNotice =
		isSearchGroundingEnabled || isUrlContextEnabled;

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
				{googleUrlContext && shouldShowMutualExclusionNotice ? (
					<div className="rounded-[8px] border border-yellow-500/40 bg-yellow-500/10 px-[12px] py-[8px] flex items-start gap-[8px]">
						<InfoIcon
							className="size-[16px] text-yellow-200 mt-[2px]"
							aria-hidden
						/>
						<div className="flex flex-col gap-[4px] text-[12px] text-yellow-100">
							{isSearchGroundingEnabled ? (
								<span>
									URL Context is unavailable while Search Grounding is active.
								</span>
							) : null}
							{isUrlContextEnabled ? (
								<span>
									Search Grounding is unavailable while URL Context is active.
								</span>
							) : null}
						</div>
					</div>
				) : null}
				<div className="mt-[16px] flex flex-col gap-[16px]">
					<Toggle
						name="searchGrounding"
						checked={isSearchGroundingEnabled}
						onCheckedChange={(checked) => {
							if (checked && isUrlContextEnabled) {
								return;
							}
							onSearchGroundingConfigurationChange(checked);
						}}
					>
						<label htmlFor="searchGrounding" className="text-text text-[14px]">
							Search Grounding
						</label>
					</Toggle>
					{googleUrlContext ? (
						<Toggle
							name="urlContext"
							checked={isUrlContextEnabled}
							onCheckedChange={(checked) => {
								if (checked && isSearchGroundingEnabled) {
									return;
								}
								onUrlContextConfigurationChange(checked);
							}}
						>
							<label htmlFor="urlContext" className="text-text text-[14px]">
								URL Context
							</label>
						</Toggle>
					) : null}
				</div>
			</div>
		</div>
	);
}
