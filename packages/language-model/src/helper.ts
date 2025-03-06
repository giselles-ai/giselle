import { type LanguageModelBase, type Tier, TierAccess } from "./base";

export function hasCapability(
	model: LanguageModelBase,
	capability: number,
): boolean {
	return (model.capabilities & capability) === capability;
}

export function hasTierAccess(model: LanguageModelBase, tier: Tier): boolean {
	return TierAccess[model.tier].includes(tier);
}
