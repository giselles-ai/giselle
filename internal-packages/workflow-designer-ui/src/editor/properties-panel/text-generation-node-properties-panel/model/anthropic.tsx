import { AnthropicLanguageModelData } from "@giselle-sdk/data-type";
import { useUsageLimits } from "@giselle-sdk/giselle/react";
import {
	anthropicLanguageModels,
	Capability,
	hasCapability,
} from "@giselle-sdk/language-model";
import { useMemo } from "react";
import { Switch } from "../../../../ui/switch";
import { TemperatureSlider, TopPSlider } from "./shared-model-controls";

export function AnthropicModelPanel({
	anthropicLanguageModel,
	onModelChange,
}: {
	anthropicLanguageModel: AnthropicLanguageModelData;
	onModelChange: (changedValue: AnthropicLanguageModelData) => void;
}) {
	useUsageLimits();

	const hasReasoningCapability = useMemo(() => {
		const languageModel = anthropicLanguageModels.find(
			(lm) => lm.id === anthropicLanguageModel.id,
		);
		return (
			!!languageModel && hasCapability(languageModel, Capability.Reasoning)
		);
	}, [anthropicLanguageModel.id]);

	return (
		<div className="flex flex-col gap-[34px]">
			<div>
				<div className="grid grid-cols-2 gap-[24px]">
					<TemperatureSlider
						onModelChange={onModelChange}
						modelData={anthropicLanguageModel}
						parseModelData={AnthropicLanguageModelData.parse}
					/>
					<TopPSlider
						onModelChange={onModelChange}
						modelData={anthropicLanguageModel}
						parseModelData={AnthropicLanguageModelData.parse}
					/>

					{hasReasoningCapability ? (
						<Switch
							label="Reasoning"
							name="reasoning"
							checked={anthropicLanguageModel.configurations.reasoningText}
							onCheckedChange={(checked) => {
								onModelChange(
									AnthropicLanguageModelData.parse({
										...anthropicLanguageModel,
										configurations: {
											...anthropicLanguageModel.configurations,
											reasoningText: checked,
										},
									}),
								);
							}}
						/>
					) : (
						<div className="flex flex-col">
							<div className="flex flex-row items-center justify-between">
								<p className="text-[14px]">Reasoning</p>
								<div className="flex-grow mx-[12px] h-[1px] bg-black-200/30" />
								<p className="text-[12px]">Unsupported</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
