import { Toggle } from "@giselle-internal/ui/toggle";
import {
	anthropicLanguageModels,
	Capability,
	hasCapability,
} from "@giselles-ai/language-model";
import { AnthropicLanguageModelData } from "@giselles-ai/protocol";
import { useUsageLimits } from "@giselles-ai/react";
import { useMemo } from "react";
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
				<div className="grid grid-cols-1 gap-[16px]">
					<TemperatureSlider
						labelClassName="text-[14px]"
						onModelChange={onModelChange}
						modelData={anthropicLanguageModel}
						parseModelData={AnthropicLanguageModelData.parse}
					/>
					<TopPSlider
						labelClassName="text-[14px]"
						onModelChange={onModelChange}
						modelData={anthropicLanguageModel}
						parseModelData={AnthropicLanguageModelData.parse}
					/>

					{hasReasoningCapability ? (
						<Toggle
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
						>
							<label htmlFor="reasoning" className="text-[14px]">
								Reasoning
							</label>
						</Toggle>
					) : (
						<div className="flex flex-col">
							<div className="flex flex-row items-center justify-between">
								<p className="text-[14px]">Reasoning</p>
								<p className="text-[12px] text-error">Unsupported</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
