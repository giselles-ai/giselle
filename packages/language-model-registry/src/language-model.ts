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
	Provider extends string = string,
	Id extends string = string,
> {
	registryVersion: "1";
	provider: Provider;
	id: Id;
	contextWindow: number;
	maxOutputTokens: number;
	knowledgeCutoff: number;
	pricing: {
		input: PricingUnit;
		output: PricingUnit;
	};
	tier: LanguageModelTier;
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
