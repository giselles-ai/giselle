import { GoogleLanguageModelData } from "@giselle-sdk/data-type";
import { useFeatureFlag, useUsageLimits } from "@giselle-sdk/giselle/react";
import { InfoIcon } from "lucide-react";
import { Switch } from "../../../../ui/switch";
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
		<div className="flex flex-col gap-[34px]">
			<div>
				<div className="grid grid-cols-2 gap-[24px]">
					<TemperatureSlider
						onModelChange={onModelChange}
						modelData={googleLanguageModel}
						parseModelData={GoogleLanguageModelData.parse}
					/>
					<TopPSlider
						onModelChange={onModelChange}
						modelData={googleLanguageModel}
						parseModelData={GoogleLanguageModelData.parse}
					/>
				</div>
				<div className="mt-[24px]" />
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
					<Switch
						label="Search Grounding"
						name="searchGrounding"
						checked={isSearchGroundingEnabled}
						onCheckedChange={(checked) => {
							if (checked && isUrlContextEnabled) {
								return;
							}
							onSearchGroundingConfigurationChange(checked);
						}}
					/>
					{googleUrlContext ? (
						<Switch
							label="URL Context"
							name="urlContext"
							checked={isUrlContextEnabled}
							onCheckedChange={(checked) => {
								if (checked && isSearchGroundingEnabled) {
									return;
								}
								onUrlContextConfigurationChange(checked);
							}}
						/>
					) : null}
				</div>
			</div>
		</div>
	);
}
