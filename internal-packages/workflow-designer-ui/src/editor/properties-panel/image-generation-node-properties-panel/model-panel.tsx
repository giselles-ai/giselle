import { ImageGenerationLanguageModelData } from "@giselle-sdk/data-type";
import {
	falLanguageModels,
	imageGenerationSizes,
} from "@giselle-sdk/language-model";
import { useUsageLimits } from "giselle-sdk/react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../ui/select";
import { Slider } from "../../../ui/slider";
import { languageModelAvailable } from "./utils";

export function ImageGenerationModelPanel({
	languageModel,
	onModelChange,
}: {
	languageModel: ImageGenerationLanguageModelData;
	onModelChange: (changedValue: ImageGenerationLanguageModelData) => void;
}) {
	const limits = useUsageLimits();

	return (
		<div className="flex flex-col gap-[34px]">
			<Select
				value={languageModel.id}
				onValueChange={(value) => {
					onModelChange(
						ImageGenerationLanguageModelData.parse({
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
						ImageGenerationLanguageModelData.parse({
							...languageModel,
							configurations: {
								...languageModel.configurations,
								n: value,
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
								ImageGenerationLanguageModelData.parse({
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
