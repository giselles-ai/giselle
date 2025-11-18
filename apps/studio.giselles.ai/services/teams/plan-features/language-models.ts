import { Tier } from "@giselles-ai/language-model";
import type { TeamPlan } from "@/db/schema";

const LANGUAGE_MODEL_TIERS: Record<TeamPlan, Tier> = {
	free: Tier.enum.free,
	pro: Tier.enum.pro,
	team: Tier.enum.pro,
	enterprise: Tier.enum.pro,
	internal: Tier.enum.pro,
};

export function getLanguageModelTier(plan: TeamPlan): Tier {
	return LANGUAGE_MODEL_TIERS[plan];
}

export function canUseProLanguageModels(plan: TeamPlan): boolean {
	return getLanguageModelTier(plan) === Tier.enum.pro;
}
