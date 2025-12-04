import type * as z from "zod/v4";

export type LanguageModelProviderMetadata = Record<string, unknown>;

export interface LanguageModelProviderDefinition<
	Id extends string = string,
	Metadata extends
		LanguageModelProviderMetadata = LanguageModelProviderMetadata,
> {
	id: Id;
	title: string;
	metadata?: Metadata;
}

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

export type ConfigurationOption<TSchema extends z.ZodType> = {
	description: string;
	schema: TSchema;
	ui?: {
		label?: string;
		min?: number;
		max?: number;
		step?: number;
	};
};

export type ConfigurationOptions = Record<
	string,
	ConfigurationOption<z.ZodTypeAny>
>;

export interface LanguageModel<
	C extends ConfigurationOptions = ConfigurationOptions,
	Provider extends
		LanguageModelProviderDefinition = LanguageModelProviderDefinition,
	Id extends string = string,
> {
	registryVersion: "1";
	provider: Provider;
	providerId: Provider["id"];
	id: Id;
	name: string;
	description: string;
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

export type AnyLanguageModel = LanguageModel<
	// biome-ignore lint/suspicious/noExplicitAny: library use
	any,
	LanguageModelProviderDefinition,
	// biome-ignore lint/suspicious/noExplicitAny: library use
	any
>;

export function defineLanguageModel<
	const C extends Record<string, ConfigurationOption<z.ZodTypeAny>>,
	const Provider extends LanguageModelProviderDefinition,
	const Id extends string,
>(
	model: Omit<LanguageModel<C, Provider, Id>, "registryVersion" | "providerId">,
): LanguageModel<C, Provider, Id> {
	return {
		...model,
		providerId: model.provider.id,
		registryVersion: "1",
	};
}

/**
 * Parses unknown configuration data against a LanguageModel's schema.
 * Each configuration option is validated using its Zod schema.
 * If validation fails for any option, the default value is used instead.
 *
 * @param model - The LanguageModel to parse configuration for
 * @param unknownData - The unknown configuration data to parse
 * @returns A validated configuration object matching the model's defaultConfiguration type
 *
 * @example
 * ```ts
 * const unknownData: Record<string, any> = {
 *   temperature: 0.8,
 *   thinking: "true", // invalid: should be boolean
 * };
 *
 * const parsed = parseConfiguration(anthropic["anthropic/claude-opus-4.1"], unknownData);
 * // Result: { temperature: 0.8, thinking: false } (thinking falls back to default)
 * ```
 */
export function parseConfiguration<M extends AnyLanguageModel>(
	model: M,
	unknownData: Record<string, unknown>,
): M["defaultConfiguration"] {
	const result: Record<string, unknown> = {};

	for (const key in model.configurationOptions) {
		if (!Object.hasOwn(model.configurationOptions, key)) {
			continue;
		}

		const option = model.configurationOptions[key];
		const defaultValue = model.defaultConfiguration[key];
		const inputValue = unknownData[key];

		// If the key doesn't exist in the input data, use default
		if (inputValue === undefined) {
			result[key] = defaultValue;
			continue;
		}

		// Try to parse the value using the Zod schema
		const parseResult = option.schema.safeParse(inputValue);

		if (parseResult.success) {
			result[key] = parseResult.data;
		} else {
			// Validation failed, use default value
			result[key] = defaultValue;
		}
	}

	return result as M["defaultConfiguration"];
}
