import { FalLanguageModelData } from "@giselle-sdk/data-type";
import { useUsageLimits } from "@giselle-sdk/giselle/react";
import {
	falLanguageModels,
	imageGenerationSizes,
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
import { languageModelAvailable } from "../utils";

export function FalModelPanel({
	languageModel,
	onModelChange,
}: {
	languageModel: FalLanguageModelData;
	onModelChange: (changedValue: FalLanguageModelData) => void;
}) {
	const limits = useUsageLimits();

	return (
		<div className="flex flex-col gap-[34px]">
			<Select
				value={languageModel.id}
				onValueChange={(value) => {
					onModelChange(
						FalLanguageModelData.parse({
							...languageModel,
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
						{falLanguageModels.map((falLanguageModel) => (
							<SelectItem
								key={falLanguageModel.id}
								value={falLanguageModel.id}
								disabled={!languageModelAvailable(falLanguageModel, limits)}
							>
								{falLanguageModel.id}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>

			<Select
				value={languageModel.configurations.size}
				onValueChange={(value) => {
					onModelChange(
						FalLanguageModelData.parse({
							...languageModel,
							configurations: {
								...languageModel.configurations,
								size: value,
							},
						}),
					);
				}}
			>
				<SelectTrigger>
					<SelectValue placeholder="Select a Size" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{imageGenerationSizes.options.map((imageGenerationSize) => (
							<SelectItem key={imageGenerationSize} value={imageGenerationSize}>
								{imageGenerationSize}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<div>
				<div className="grid grid-cols-2 gap-[24px]">
					<Slider
						label="Number of Images"
						value={languageModel.configurations.n}
						max={4.0}
						min={1.0}
						step={1.0}
						onChange={(value) => {
							onModelChange(
								FalLanguageModelData.parse({
									...languageModel,
									configurations: {
										...languageModel.configurations,
										n: value,
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
