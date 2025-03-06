import {
	OpenAILanguageModel,
	openaiLanguageModels,
} from "@giselle-sdk/language-model";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../ui/select";
import { Slider } from "../../../../ui/slider";

export function OpenAIModelPanel({
	openaiLanguageModel,
	onModelChange,
}: {
	openaiLanguageModel: OpenAILanguageModel;
	onModelChange: (changedValue: OpenAILanguageModel) => void;
}) {
	return (
		<div className="flex flex-col gap-[34px]">
			<Select
				value={openaiLanguageModel.id}
				onValueChange={(value) => {
					onModelChange(
						OpenAILanguageModel.parse({
							...openaiLanguageModel,
							id: value,
						}),
					);
				}}
			>
				<SelectTrigger>
					<SelectValue placeholder="Select a LLM" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{openaiLanguageModels.map((model) => (
							<SelectItem key={model.id} value={model.id}>
								{model.id}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
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
								OpenAILanguageModel.parse({
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
								OpenAILanguageModel.parse({
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
								OpenAILanguageModel.parse({
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
								OpenAILanguageModel.parse({
									...openaiLanguageModel,
									configurations: {
										...openaiLanguageModel.configurations,
										presencePenalty: value,
									},
								}),
							);
						}}
					/>
				</div>
			</div>
		</div>
	);
}
