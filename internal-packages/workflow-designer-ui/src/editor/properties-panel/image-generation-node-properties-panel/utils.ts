import { type LanguageModel, hasTierAccess } from "@giselle-sdk/language-model";
import type { UsageLimits } from "@giselle-sdk/usage-limits";

export function languageModelAvailable(
	languageModel: LanguageModel,
	limits?: UsageLimits,
) {
	if (!limits) {
		return true;
	}
	return hasTierAccess(languageModel, limits.featureTier);
}
