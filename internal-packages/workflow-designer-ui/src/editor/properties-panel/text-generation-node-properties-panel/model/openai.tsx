import { OpenAILanguageModelData, type ToolSet } from "@giselle-sdk/data-type";
import {
	Capability,
	hasCapability,
	openaiLanguageModels,
} from "@giselle-sdk/language-model";
import { useUsageLimits } from "giselle-sdk/react";
import { useMemo } from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../ui/select";
import { Slider } from "../../../../ui/slider";
import { Switch } from "../../../../ui/switch";
import { languageModelAvailable } from "./utils";

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
	const limits = useUsageLimits();
	const languageModel = useMemo(
		() => openaiLanguageModels.find((lm) => lm.id === openaiLanguageModel.id),
		[openaiLanguageModel.id],
	);

	return (
		<div className="flex flex-col gap-[34px]">
			<div className="grid grid-cols-2 gap-[24px]">
				<div className="flex flex-col col-span-2">
					<div className="text-[14px] py-[1.5px]">Model</div>
					<Select
						value={openaiLanguageModel.id}
						onValueChange={(value) => {
							onModelChange(
								OpenAILanguageModelData.parse({
									...openaiLanguageModel,
									id: value,
								}),
							);
						}}
					>
						<SelectTrigger className="border-[2px]">
							<SelectValue placeholder="Select a LLM" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{openaiLanguageModels.map((model) => (
									<SelectItem
										key={model.id}
										value={model.id}
										disabled={!languageModelAvailable(model, limits)}
									>
										{model.id}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</div>
			<div>
				<div className="grid grid-cols-2 gap-[24px]">
					<Slider
						label="Temperature"
						value={openaiLanguageModel.configurations.temperature}
						max={2.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								OpenAILanguageModelData.parse({
									...openaiLanguageModel,
									configurations: {
										...openaiLanguageModel.configurations,
										temperature: value,
									},
								}),
							);
						}}
					/>
					<Slider
						label="Top P"
						value={openaiLanguageModel.configurations.topP}
						max={1.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								OpenAILanguageModelData.parse({
									...openaiLanguageModel,
									configurations: {
										...openaiLanguageModel.configurations,
										topP: value,
									},
								}),
							);
						}}
					/>
					<Slider
						label="Frequency Panalty"
						value={openaiLanguageModel.configurations.frequencyPenalty}
						max={2.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								OpenAILanguageModelData.parse({
									...openaiLanguageModel,
									configurations: {
										...openaiLanguageModel.configurations,
										frequencyPenalty: value,
									},
								}),
							);
						}}
					/>
					<Slider
						label="Presence Penalty"
						value={openaiLanguageModel.configurations.presencePenalty}
						max={2.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								OpenAILanguageModelData.parse({
									...openaiLanguageModel,
									configurations: {
										...openaiLanguageModel.configurations,
										presencePenalty: value,
									},
								}),
							);
						}}
					/>
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
							!hasCapability(
								languageModel,
								Capability.OptionalSearchGrounding,
							) &&
							"Web search will not use since the current model does not support web search"
						}
					/>
				</div>
			</div>
		</div>
	);
}
