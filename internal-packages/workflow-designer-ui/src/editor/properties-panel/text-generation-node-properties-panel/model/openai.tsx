import { Select } from "@giselle-internal/ui/select";
import { Toggle } from "@giselle-internal/ui/toggle";
import {
	Capability,
	hasCapability,
	openaiLanguageModels,
} from "@giselles-ai/language-model";
import { OpenAILanguageModelData, type ToolSet } from "@giselles-ai/protocol";
import { useUsageLimits } from "@giselles-ai/react";
import { useMemo } from "react";
import { SettingRow } from "../../ui/setting-row";
import {
	FrequencyPenaltySlider,
	PresencePenaltySlider,
	TemperatureSlider,
	TopPSlider,
} from "./shared-model-controls";

/**
 * Returns the available reasoning effort options for the given OpenAI model.
 *
 * GPT-5.2 and GPT-5.1-thinking support: none/low/medium/high/xhigh
 * GPT-5.1-codex supports: low/medium/high
 * Older models (gpt-5, gpt-5-mini, gpt-5-nano) support: minimal/low/medium/high
 *
 * @see https://platform.openai.com/docs/guides/latest-model#gpt-5-2-parameter-compatibility
 */
function getReasoningEffortOptions(modelId: string): readonly string[] {
	if (modelId === "gpt-5.2" || modelId === "gpt-5.1-thinking") {
		return ["none", "low", "medium", "high", "xhigh"] as const;
	}
	if (modelId === "gpt-5.1-codex") {
		return ["low", "medium", "high"] as const;
	}
	return ["minimal", "low", "medium", "high"] as const;
}

/**
 * Returns the available textVerbosity options for the given OpenAI model.
 * GPT-5.1-codex only supports verbosity: medium.
 */
function getTextVerbosityOptions(modelId: string): readonly string[] {
	if (modelId === "gpt-5.1-codex") {
		return ["medium"] as const;
	}
	return ["low", "medium", "high"] as const;
}

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
		<div className="flex flex-col gap-[8px]">
			{hasCapability(languageModel, Capability.Reasoning) ? (
				<div className="grid grid-cols-1 gap-[8px]">
					<SettingRow
						label={
							<label
								htmlFor="reasoningEffort"
								className="text-text text-[14px]"
							>
								Reasoning effort
							</label>
						}
					>
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
							options={getReasoningEffortOptions(openaiLanguageModel.id).map(
								(v) => ({
									value: v,
									label: v,
								}),
							)}
						/>
					</SettingRow>

					<SettingRow
						label={
							<label htmlFor="verbosity" className="text-text text-[14px]">
								Verbosity
							</label>
						}
					>
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
							options={getTextVerbosityOptions(openaiLanguageModel.id).map(
								(v) => ({
									value: v,
									label: v,
								}),
							)}
						/>
					</SettingRow>
				</div>
			) : (
				<div>
					<div className="grid grid-cols-1 gap-[16px]">
						<TemperatureSlider
							labelClassName="text-[14px]"
							onModelChange={onModelChange}
							modelData={openaiLanguageModel}
							parseModelData={OpenAILanguageModelData.parse}
						/>
						<TopPSlider
							labelClassName="text-[14px]"
							onModelChange={onModelChange}
							modelData={openaiLanguageModel}
							parseModelData={OpenAILanguageModelData.parse}
						/>
						<FrequencyPenaltySlider
							labelClassName="text-[14px]"
							onModelChange={onModelChange}
							modelData={openaiLanguageModel}
							parseModelData={OpenAILanguageModelData.parse}
						/>
						<PresencePenaltySlider
							labelClassName="text-[14px]"
							onModelChange={onModelChange}
							modelData={openaiLanguageModel}
							parseModelData={OpenAILanguageModelData.parse}
						/>
					</div>
				</div>
			)}
			<Toggle
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
			>
				<label htmlFor="webSearch" className="text-text text-[14px]">
					Web Search
				</label>
			</Toggle>
			{languageModel &&
				tools?.openaiWebSearch &&
				!hasCapability(languageModel, Capability.OptionalSearchGrounding) && (
					<p className="text-[12px] text-error-900 mt-[4px]">
						Web search is not supported by the selected model
					</p>
				)}
		</div>
	);
}
