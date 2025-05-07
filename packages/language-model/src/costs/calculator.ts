import type { Cost, TokenBasedPrice } from "./pricing";
import type { ImageUsage, ModelUsage, TokenUsage } from "./usage";

export interface CostResult {
	input: Cost;
	output: Cost;
	total: Cost;
}

/**
 * Base interface for tool configurations
 * All provider-specific configurations should extend this interface
 * and be defined in their respective provider files.
 */
export interface ToolConfig {
	[key: string]: unknown;
}

export interface CostCalculator<
	TToolConfig extends ToolConfig | undefined = ToolConfig,
	TUsage extends ModelUsage = TokenUsage,
> {
	calculate(
		model: string,
		toolConfig: TToolConfig,
		usage: TUsage,
	): Promise<CostResult>;
}

export class DefaultCostCalculator implements CostCalculator {
	constructor(private provider: string) {}

	async calculate(): Promise<CostResult> {
		console.log(`No cost calculator found for ${this.provider}`);
		return { input: 0, output: 0, total: 0 };
	}
}

export function calculateTokenCost(
	tokens: number,
	pricing: TokenBasedPrice,
): Cost {
	// Flat rate
	if (!("threshold" in pricing)) {
		return (tokens * pricing.costPerMegaToken) / 1_000_000;
	}

	// Tiered rate
	let baseTokens: number;
	let extraTokens: number;

	if (pricing.thresholdType === "<=") {
		// Inclusive threshold
		baseTokens = Math.min(tokens, pricing.threshold);
		extraTokens = Math.max(0, tokens - pricing.threshold);
	} else {
		// Exclusive threshold
		baseTokens = Math.min(tokens, pricing.threshold - 1);
		extraTokens = Math.max(0, tokens - pricing.threshold + 1);
	}

	return (
		(baseTokens * pricing.costPerMegaToken +
			extraTokens * pricing.costPerMegaTokenAboveThreshold) /
		1_000_000
	);
}
