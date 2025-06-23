import { OpenAIImageLanguageModelData } from "@giselle-sdk/data-type";
import {
	openaiImageBackground,
	openaiImageModels,
	openaiImageModeration,
	openaiImageQuality,
	openaiImageSize,
} from "@giselle-sdk/language-model";
import { useUsageLimits } from "giselle-sdk/react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../ui/select";
import { languageModelAvailable } from "../utils";

export function OpenAIImageModelPanel({
	languageModel,
	onModelChange,
}: {
	languageModel: OpenAIImageLanguageModelData;
	onModelChange: (changedValue: OpenAIImageLanguageModelData) => void;
}) {
	const limits = useUsageLimits();

	return (
		<div className="flex flex-col gap-[34px]">
			<div className="grid grid-cols-2 gap-[24px]">
				<div className="flex flex-col col-span-2">
					<div className="text-[14px] py-[1.5px]">Model</div>
					<Select
						value={languageModel.id}
						onValueChange={(value) => {
							onModelChange(
								OpenAIImageLanguageModelData.parse({
									...languageModel,
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
								{openaiImageModels.map((openaiImageModel) => (
									<SelectItem
										key={openaiImageModel.id}
										value={openaiImageModel.id}
										disabled={!languageModelAvailable(openaiImageModel, limits)}
									>
										{openaiImageModel.id}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col">
					<div className="text-[14px] py-[1.5px]">Size</div>
					<Select
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
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a Size" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{openaiImageSize.options.map((imageGenerationSize) => (
									<SelectItem
										key={imageGenerationSize}
										value={imageGenerationSize}
									>
										{imageGenerationSize}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col">
					<div className="text-[14px] py-[1.5px]">Quality</div>
					<Select
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
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a quality" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{openaiImageQuality.options.map((openaiImageQuality) => (
									<SelectItem
										key={openaiImageQuality}
										value={openaiImageQuality}
									>
										{openaiImageQuality}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col">
					<div className="text-[14px] py-[1.5px]">Background</div>
					<Select
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
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a background" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{openaiImageBackground.options.map((openaiImageBackground) => (
									<SelectItem
										key={openaiImageBackground}
										value={openaiImageBackground}
									>
										{openaiImageBackground}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col">
					<div className="text-[14px] py-[1.5px]">Moderation</div>
					<Select
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
					>
						<SelectTrigger>
							<SelectValue placeholder="Select a moderation" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{openaiImageModeration.options.map((openaiImageModeration) => (
									<SelectItem
										key={openaiImageModeration}
										value={openaiImageModeration}
									>
										{openaiImageModeration}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}
