import {
	isImageGenerationLanguageModelData,
	isTextGenerationLanguageModelData,
	type Node,
} from "@giselle-sdk/data-type";
import {
	createImageGenerationNode,
	createTextGenerationNode,
} from "@giselle-sdk/giselle/react";
import {
	Capability,
	hasCapability,
	hasTierAccess,
	type LanguageModel,
	type Tier,
} from "@giselle-sdk/language-model";
import type { AddNodeTool } from "../../types";

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

export function isProModelForFreeUser(
	model: LanguageModel,
	userTier: Tier,
): boolean {
	return userTier === "free" && !hasTierAccess(model, userTier);
}

export function createModelClickHandler(
	model: LanguageModel,
	userTier: Tier,
	setSelectedTool: (tool: AddNodeTool) => void,
	addNodeTool: (node: Node) => AddNodeTool,
) {
	return () => {
		// Prevent adding pro models for free users
		if (isProModelForFreeUser(model, userTier)) {
			return;
		}

		const languageModelData = {
			id: model.id,
			provider: model.provider,
			configurations: model.configurations,
		};

		if (isTextGenerationLanguageModelData(languageModelData)) {
			setSelectedTool(addNodeTool(createTextGenerationNode(languageModelData)));
		}

		if (isImageGenerationLanguageModelData(languageModelData)) {
			setSelectedTool(
				addNodeTool(createImageGenerationNode(languageModelData)),
			);
		}
	};
}
