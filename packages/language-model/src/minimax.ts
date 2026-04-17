import * as z from "zod/v4";
import { Capability, LanguageModelBase, Tier } from "./base";
import { BaseCostCalculator } from "./costs/calculator";
import { minimaxTokenPricing } from "./costs/model-prices";

const MiniMaxLanguageModelConfigurations = z.object({
	temperature: z.number(),
	topP: z.number(),
});
type MiniMaxLanguageModelConfigurations = z.infer<
	typeof MiniMaxLanguageModelConfigurations
>;

const defaultConfigurations: MiniMaxLanguageModelConfigurations = {
	temperature: 0.7,
	topP: 1.0,
};

export const MiniMaxLanguageModelId = z
	.enum(["MiniMax-M2.7", "MiniMax-M2.7-highspeed"])
	.catch("MiniMax-M2.7");

const MiniMaxLanguageModel = LanguageModelBase.extend({
	id: MiniMaxLanguageModelId,
	provider: z.literal("minimax"),
	configurations: MiniMaxLanguageModelConfigurations,
});
type MiniMaxLanguageModel = z.infer<typeof MiniMaxLanguageModel>;

const minimaxM27: MiniMaxLanguageModel = {
	provider: "minimax",
	id: "MiniMax-M2.7",
	capabilities: Capability.TextGeneration | Capability.Reasoning,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

const minimaxM27Highspeed: MiniMaxLanguageModel = {
	provider: "minimax",
	id: "MiniMax-M2.7-highspeed",
	capabilities: Capability.TextGeneration,
	tier: Tier.enum.pro,
	configurations: defaultConfigurations,
};

export const models = [minimaxM27, minimaxM27Highspeed];

export const LanguageModel = MiniMaxLanguageModel;
export type LanguageModel = MiniMaxLanguageModel;

export class MiniMaxCostCalculator extends BaseCostCalculator {
	protected getPricingTable() {
		return minimaxTokenPricing;
	}
}
