import type * as z from "zod/v4";

interface PricingUnit {
	perToken: number;
	perK: number;
	perM: number;
}
export function definePricing(perM: number): PricingUnit {
	const perToken = perM / 1_000_000;
	const perK = perM / 1_000;
	return {
		perToken,
		perK,
		perM,
	};
}
export type LanguageModelTier = "free" | "pro";

/**
 * Tier hierarchy order. Higher values indicate higher tier levels.
 * Users with a higher tier can access models with lower or equal requiredTier.
 */
export const TIER_ORDER: Record<LanguageModelTier, number> = {
	free: 0,
	pro: 1,
} as const;

/**
 * Check if a user with the given tier can access a model with the required tier.
 * Users with a higher tier can access models with lower or equal requiredTier.
 *
 * @example
 * hasTierAccess("free", "free") // true
 * hasTierAccess("free", "pro")  // false
 * hasTierAccess("pro", "free")  // true (pro users can access free models)
 * hasTierAccess("pro", "pro")   // true
 */
export function hasTierAccess(
	userTier: LanguageModelTier,
	requiredTier: LanguageModelTier,
) {
	return TIER_ORDER[userTier] >= TIER_ORDER[requiredTier];
}

type ConfigurationOption<TSchema extends z.ZodTypeAny> = {
	description: string;
	schema: TSchema;
};

export type ConfigurationOptions = Record<
	string,
	ConfigurationOption<z.ZodTypeAny>
>;

export interface LanguageModel<
	C extends ConfigurationOptions = ConfigurationOptions,
	Provider extends string = string,
	Id extends string = string,
> {
	registryVersion: "1";
	provider: Provider;
	id: Id;
	name: string;
	contextWindow: number;
	maxOutputTokens: number;
	knowledgeCutoff: number;
	pricing: {
		input: PricingUnit;
		output: PricingUnit;
	};
	requiredTier: LanguageModelTier;
	url: string;
	configurationOptions: C;
	defaultConfiguration: {
		[K in keyof C]: z.infer<C[K]["schema"]>;
	};
}

// biome-ignore lint/suspicious/noExplicitAny: library use
export type AnyLanguageModel = LanguageModel<any, any, any>;

export function defineLanguageModel<
	const C extends Record<string, ConfigurationOption<z.ZodTypeAny>>,
	const Provider extends string,
	const Id extends string,
>(
	model: Omit<LanguageModel<C, Provider, Id>, "registryVersion">,
): LanguageModel<C, Provider, Id> {
	return { ...model, registryVersion: "1" };
}
