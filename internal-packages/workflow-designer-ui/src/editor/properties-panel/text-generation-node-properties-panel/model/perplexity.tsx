import { PerplexityLanguageModelData } from "@giselle-sdk/data-type";
import { perplexityLanguageModels } from "@giselle-sdk/language-model";
import { useUsageLimits } from "giselle-sdk/react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../ui/select";
import { Slider } from "../../../../ui/slider";
import { languageModelAvailable } from "./utils";

export function PerplexityModelPanel({
	perplexityLanguageModel,
	onModelChange,
}: {
	perplexityLanguageModel: PerplexityLanguageModelData;
	onModelChange: (changedValue: PerplexityLanguageModelData) => void;
}) {
	const limits = useUsageLimits();

	return (
		<div className="flex flex-col gap-[34px] px-[8px]">
			<Select
				value={perplexityLanguageModel.id}
				onValueChange={(value) => {
					onModelChange(
						PerplexityLanguageModelData.parse({
							...perplexityLanguageModel,
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
						{perplexityLanguageModels.map((perplexityLanguageModel) => (
							<SelectItem
								key={perplexityLanguageModel.id}
								value={perplexityLanguageModel.id}
								disabled={
									!languageModelAvailable(perplexityLanguageModel, limits)
								}
							>
								{perplexityLanguageModel.id}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<div>
				<div className="grid grid-cols-2 gap-[16px]">
					<Slider
						label="Temperature"
						value={perplexityLanguageModel.configurations.temperature}
						max={2.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								PerplexityLanguageModelData.parse({
									...perplexityLanguageModel,
									configurations: {
										...perplexityLanguageModel.configurations,
										temperature: value,
									},
								}),
							);
						}}
					/>
					<Slider
						label="Top P"
						value={perplexityLanguageModel.configurations.topP}
						max={1.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								PerplexityLanguageModelData.parse({
									...perplexityLanguageModel,
									configurations: {
										...perplexityLanguageModel.configurations,
										topP: value,
									},
								}),
							);
						}}
					/>
					<Slider
						label="Frequency Panalty"
						value={perplexityLanguageModel.configurations.frequencyPenalty}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								PerplexityLanguageModelData.parse({
									...perplexityLanguageModel,
									configurations: {
										...perplexityLanguageModel.configurations,
										frequencyPenalty: value,
									},
								}),
							);
						}}
					/>
					<Slider
						label="Presence Penalty"
						value={perplexityLanguageModel.configurations.presencePenalty}
						max={2.0}
						min={-2.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								PerplexityLanguageModelData.parse({
									...perplexityLanguageModel,
									configurations: {
										...perplexityLanguageModel.configurations,
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
