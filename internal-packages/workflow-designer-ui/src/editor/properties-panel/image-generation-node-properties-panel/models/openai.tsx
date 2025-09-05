import { Select } from "@giselle-internal/ui/select";
import { OpenAIImageLanguageModelData } from "@giselle-sdk/data-type";
import { useUsageLimits } from "@giselle-sdk/giselle/react";
import {
	openaiImageBackground,
	openaiImageModeration,
	openaiImageQuality,
	openaiImageSize,
} from "@giselle-sdk/language-model";

export function OpenAIImageModelPanel({
	languageModel,
	onModelChange,
}: {
	languageModel: OpenAIImageLanguageModelData;
	onModelChange: (changedValue: OpenAIImageLanguageModelData) => void;
}) {
	const _limits = useUsageLimits();

	return (
		<div className="flex flex-col gap-[16px]">
			<div className="grid grid-cols-2 gap-[24px]">
				<fieldset className="flex flex-col">
					<label htmlFor="size" className="text-text text-[13px] mb-[2px]">
						Size
					</label>
					<Select
						id="size"
						placeholder="Select a Size"
						value={languageModel.configurations.size}
						onValueChange={(value) => {
							onModelChange(
								OpenAIImageLanguageModelData.parse({
									...languageModel,
									configurations: {
										...languageModel.configurations,
										size: value,
									},
								}),
							);
						}}
						options={openaiImageSize.options.map((imageGenerationSize) => ({
							value: imageGenerationSize,
							label: imageGenerationSize,
						}))}
					/>
				</fieldset>

				<fieldset className="flex flex-col">
					<label htmlFor="quality" className="text-text text-[13px] mb-[2px]">
						Quality
					</label>
					<Select
						id="quality"
						placeholder="Select a quality"
						value={languageModel.configurations.quality}
						onValueChange={(value) => {
							onModelChange(
								OpenAIImageLanguageModelData.parse({
									...languageModel,
									configurations: {
										...languageModel.configurations,
										quality: value,
									},
								}),
							);
						}}
						options={openaiImageQuality.options.map((openaiImageQuality) => ({
							value: openaiImageQuality,
							label: openaiImageQuality,
						}))}
					/>
				</fieldset>

				<fieldset className="flex flex-col">
					<label
						htmlFor="background"
						className="text-text text-[13px] mb-[2px]"
					>
						Background
					</label>
					<Select
						id="background"
						placeholder="Select a background"
						value={languageModel.configurations.background}
						onValueChange={(value) => {
							onModelChange(
								OpenAIImageLanguageModelData.parse({
									...languageModel,
									configurations: {
										...languageModel.configurations,
										background: value,
									},
								}),
							);
						}}
						options={openaiImageBackground.options.map(
							(openaiImageBackground) => ({
								value: openaiImageBackground,
								label: openaiImageBackground,
							}),
						)}
					/>
				</fieldset>

				<fieldset className="flex flex-col">
					<label
						htmlFor="moderation"
						className="text-text text-[13px] mb-[2px]"
					>
						Moderation
					</label>
					<Select
						id="moderation"
						placeholder="Select a moderation"
						value={languageModel.configurations.moderation}
						onValueChange={(value) => {
							onModelChange(
								OpenAIImageLanguageModelData.parse({
									...languageModel,
									configurations: {
										...languageModel.configurations,
										moderation: value,
									},
								}),
							);
						}}
						options={openaiImageModeration.options.map(
							(openaiImageModeration) => ({
								value: openaiImageModeration,
								label: openaiImageModeration,
							}),
						)}
					/>
				</fieldset>
			</div>
		</div>
	);
}
