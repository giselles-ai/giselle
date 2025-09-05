import { Select } from "@giselle-internal/ui/select";
import { OpenAILanguageModelData, type ToolSet } from "@giselle-sdk/data-type";
import { useUsageLimits } from "@giselle-sdk/giselle/react";
import {
	Capability,
	hasCapability,
	openaiLanguageModels,
} from "@giselle-sdk/language-model";
import { useMemo } from "react";
import { Switch } from "../../../../ui/switch";
import {
	FrequencyPenaltySlider,
	PresencePenaltySlider,
	TemperatureSlider,
	TopPSlider,
} from "./shared-model-controls";

export function OpenAIModelPanel({
	openaiLanguageModel,
	onModelChange,
	tools,
	onToolChange,
	onWebSearchChange,
}: {
	openaiLanguageModel: OpenAILanguageModelData;
	onModelChange: (changedValue: OpenAILanguageModelData) => void;
	tools?: ToolSet;
	onToolChange: (changedValue: ToolSet) => void;
	onWebSearchChange: (enabled: boolean) => void;
}) {
	useUsageLimits();
	const languageModel = useMemo(
		() => openaiLanguageModels.find((lm) => lm.id === openaiLanguageModel.id),
		[openaiLanguageModel.id],
	);
	if (languageModel === undefined) {
		console.error("Language Model Not Found", openaiLanguageModel);
		return <div>Language Model Not Found</div>;
	}

	return (
		<div className="flex flex-col gap-[16px]">
			{hasCapability(languageModel, Capability.Reasoning) ? (
				<div className="grid grid-cols-2 gap-[16px] mb-[16px]">
					<fieldset className="flex flex-col min-w-0">
						<label
							htmlFor="reasoningEffort"
							className="text-text text-[13px] mb-[2px]"
						>
							Reasoning effort
						</label>
						<Select
							id="reasoningEffort"
							placeholder="Select reasoning effort"
							value={openaiLanguageModel.configurations.reasoningEffort}
							onValueChange={(value) => {
								onModelChange(
									OpenAILanguageModelData.parse({
										...openaiLanguageModel,
										configurations: {
											...openaiLanguageModel.configurations,
											reasoningEffort: value,
										},
									}),
								);
							}}
							options={["minimal", "low", "medium", "high"].map((v) => ({
								value: v,
								label: v,
							}))}
						/>
					</fieldset>

					<fieldset className="flex flex-col min-w-0">
						<label
							htmlFor="verbosity"
							className="text-text text-[13px] mb-[2px]"
						>
							Verbosity
						</label>
						<Select
							id="verbosity"
							placeholder="Select verbosity"
							value={openaiLanguageModel.configurations.textVerbosity}
							onValueChange={(value) => {
								onModelChange(
									OpenAILanguageModelData.parse({
										...openaiLanguageModel,
										configurations: {
											...openaiLanguageModel.configurations,
											textVerbosity: value,
										},
									}),
								);
							}}
							options={["low", "medium", "high"].map((v) => ({
								value: v,
								label: v,
							}))}
						/>
					</fieldset>
				</div>
			) : (
				<div>
					<div className="grid grid-cols-2 gap-[24px]">
						<TemperatureSlider
							onModelChange={onModelChange}
							modelData={openaiLanguageModel}
							parseModelData={OpenAILanguageModelData.parse}
						/>
						<TopPSlider
							onModelChange={onModelChange}
							modelData={openaiLanguageModel}
							parseModelData={OpenAILanguageModelData.parse}
						/>
						<FrequencyPenaltySlider
							onModelChange={onModelChange}
							modelData={openaiLanguageModel}
							parseModelData={OpenAILanguageModelData.parse}
						/>
						<PresencePenaltySlider
							onModelChange={onModelChange}
							modelData={openaiLanguageModel}
							parseModelData={OpenAILanguageModelData.parse}
						/>
					</div>
				</div>
			)}
			<Switch
				label="Web Search"
				name="webSearch"
				checked={!!tools?.openaiWebSearch}
				onCheckedChange={(checked) => {
					let changedTools: ToolSet = {};
					for (const toolName of Object.keys(tools ?? {})) {
						const tool = tools?.[toolName as keyof ToolSet];

						if (
							tool === undefined ||
							(!checked && toolName === "openaiWebSearch")
						) {
							continue;
						}
						changedTools = {
							...changedTools,
							[toolName]: tool,
						};
					}
					if (checked) {
						changedTools = {
							...tools,
							openaiWebSearch: {
								searchContextSize: "medium",
							},
						};
					}
					onToolChange(changedTools);
					onWebSearchChange(checked);
				}}
				note={
					languageModel &&
					tools?.openaiWebSearch &&
					!hasCapability(languageModel, Capability.OptionalSearchGrounding) &&
					"Web search is not supported by the selected model"
				}
			/>
		</div>
	);
}
