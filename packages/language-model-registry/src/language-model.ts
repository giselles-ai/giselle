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
type LanguageModelTier = "free" | "pro";

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
> {
	provider: string;
	id: string;
	contextWindow: number;
	maxOutputTokens: number;
	knowledgeCutoff: number;
	pricing: {
		input: PricingUnit;
		output: PricingUnit;
	};
	tier: LanguageModelTier;
	configurationOptions: C;
	defaultConfiguration: {
		[K in keyof C]: z.infer<C[K]["schema"]>;
	};
}

// biome-ignore lint/suspicious/noExplicitAny: library use
export type AnyLanguageModel = LanguageModel<any>;

export function defineLanguageModel<
	const C extends Record<string, ConfigurationOption<z.ZodTypeAny>>,
>(model: LanguageModel<C>): LanguageModel<C> {
	return model;
}
