import { Select } from "@giselle-internal/ui/select";
import { SettingRow } from "@giselle-internal/ui/setting-row";
import { FalLanguageModelData } from "@giselle-sdk/data-type";

import { imageGenerationSizes } from "@giselle-sdk/language-model";
import { Slider } from "../../../../ui/slider";

export function FalModelPanel({
	languageModel,
	onModelChange,
}: {
	languageModel: FalLanguageModelData;
	onModelChange: (changedValue: FalLanguageModelData) => void;
}) {
	const updateConfiguration = (
		updates: Partial<FalLanguageModelData["configurations"]>,
	) => {
		onModelChange(
			FalLanguageModelData.parse({
				...languageModel,
				configurations: {
					...languageModel.configurations,
					...updates,
				},
			}),
		);
	};

	return (
		<div className="grid grid-cols-1 gap-[8px]">
			<SettingRow
				label={
					<label htmlFor="size" className="text-text text-[14px]">
						Size
					</label>
				}
			>
				<Select
					id="size"
					placeholder="Select a Size"
					value={languageModel.configurations.size}
					onValueChange={(value) =>
						updateConfiguration({
							size: value as FalLanguageModelData["configurations"]["size"],
						})
					}
					options={imageGenerationSizes.options.map((imageGenerationSize) => ({
						value: imageGenerationSize,
						label: imageGenerationSize,
					}))}
				/>
			</SettingRow>
			<Slider
				label="Number of Images"
				value={languageModel.configurations.n}
				max={4.0}
				min={1.0}
				step={1.0}
				onChange={(value) => updateConfiguration({ n: value })}
			/>
		</div>
	);
}
