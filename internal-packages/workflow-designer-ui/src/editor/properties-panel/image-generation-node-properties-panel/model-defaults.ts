import {
	FalLanguageModelData,
	GoogleImageLanguageModelData,
	type ImageGenerationLanguageModelData,
	type ImageGenerationLanguageModelProvider,
	OpenAIImageLanguageModelData,
} from "@giselle-sdk/data-type";

export function createDefaultModelData(
	provider: ImageGenerationLanguageModelProvider,
): ImageGenerationLanguageModelData {
	switch (provider) {
		case "fal":
			return FalLanguageModelData.parse({
				provider: "fal",
				id: "fal-ai/flux/schnell",
				configurations: {
					size: "1152x864",
					n: 1,
				},
			});
		case "openai":
			return OpenAIImageLanguageModelData.parse({
				provider: "openai",
				id: "gpt-image-1",
				configurations: {
					n: 1,
					size: "1024x1024",
					quality: "auto",
					background: "auto",
					moderation: "auto",
				},
			});
		case "google":
			return GoogleImageLanguageModelData.parse({
				provider: "google",
				id: "gemini-2.5-flash-image-preview",
				configurations: {
					responseModalities: ["IMAGE"],
				},
			});
		default: {
			const _exhaustiveCheck: never = provider;
			throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
		}
	}
}

export function updateModelId(
	currentModel: ImageGenerationLanguageModelData,
	newModelId: string,
): ImageGenerationLanguageModelData {
	switch (currentModel.provider) {
		case "fal":
			return FalLanguageModelData.parse({
				...currentModel,
				id: newModelId,
			});
		case "openai":
			return OpenAIImageLanguageModelData.parse({
				...currentModel,
				id: newModelId,
			});
		case "google":
			return GoogleImageLanguageModelData.parse({
				...currentModel,
				id: newModelId,
			});
		default: {
			const _exhaustiveCheck: never = currentModel;
			throw new Error(
				`Unhandled provider: ${JSON.stringify(_exhaustiveCheck)}`,
			);
		}
	}
}
