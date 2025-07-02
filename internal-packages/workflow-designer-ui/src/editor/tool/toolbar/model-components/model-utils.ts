import {
	Capability,
	hasCapability,
	type LanguageModel,
} from "@giselle-sdk/language-model";

export function filterModelsByCategory(
	model: LanguageModel,
	selectedCategory: string,
): boolean {
	if (selectedCategory === "All") return true;
	if (
		selectedCategory === "Text" &&
		hasCapability(model, Capability.TextGeneration)
	)
		return true;
	if (
		selectedCategory === "Image" &&
		hasCapability(model, Capability.ImageGeneration)
	)
		return true;
	if (selectedCategory === "Video" || selectedCategory === "Audio")
		return false;
	return false;
}

export function filterModelsBySearch(
	model: LanguageModel,
	query: string,
): boolean {
	if (!query.trim()) return true;
	return (
		model.id.toLowerCase().includes(query.toLowerCase()) ||
		model.provider.toLowerCase().includes(query.toLowerCase())
	);
}

export function getAvailableModels(
	preferredModelIds: string[],
	provider: string,
	llmProviders: string[],
	models: LanguageModel[],
): LanguageModel[] {
	const found = preferredModelIds
		.map((id) => models.find((m) => m.id === id && m.provider === provider))
		.filter(
			(m): m is LanguageModel => !!m && llmProviders.includes(m.provider),
		);
	if (found.length > 0) return found;
	return models
		.filter((m) => m.provider === provider && llmProviders.includes(provider))
		.slice(0, 1);
}
