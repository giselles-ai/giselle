import { GoogleLanguageModelData } from "@giselle-sdk/data-type";
import { useUsageLimits } from "@giselle-sdk/giselle/react";
import { googleLanguageModels } from "@giselle-sdk/language-model";
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

export function GoogleModelPanel({
	googleLanguageModel,
	onModelChange,
	onSearchGroundingConfigurationChange,
}: {
	googleLanguageModel: GoogleLanguageModelData;
	onModelChange: (changedValue: GoogleLanguageModelData) => void;
	onSearchGroundingConfigurationChange: (enabled: boolean) => void;
}) {
	const limits = useUsageLimits();

	return (
		<div className="flex flex-col gap-[34px]">
			<Select
				value={googleLanguageModel.id}
				onValueChange={(value) => {
					onModelChange(
						GoogleLanguageModelData.parse({
							...googleLanguageModel,
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
						{googleLanguageModels.map((googleLanguageModel) => (
							<SelectItem
								key={googleLanguageModel.id}
								value={googleLanguageModel.id}
								disabled={!languageModelAvailable(googleLanguageModel, limits)}
							>
								{googleLanguageModel.id}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<div>
				<div className="grid grid-cols-2 gap-[24px]">
					<Slider
						label="Temperature"
						value={googleLanguageModel.configurations.temperature}
						max={2.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								GoogleLanguageModelData.parse({
									...googleLanguageModel,
									configurations: {
										...googleLanguageModel.configurations,
										temperature: value,
									},
								}),
							);
						}}
					/>
					<Slider
						label="Top P"
						value={googleLanguageModel.configurations.topP}
						max={1.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								GoogleLanguageModelData.parse({
									...googleLanguageModel,
									configurations: {
										...googleLanguageModel.configurations,
										topP: value,
									},
								}),
							);
						}}
					/>
					<Switch
						label="Search Grounding"
						name="searchGrounding"
						checked={googleLanguageModel.configurations.searchGrounding}
						onCheckedChange={(checked) => {
							onSearchGroundingConfigurationChange(checked);
						}}
					/>
				</div>
			</div>
		</div>
	);
}
