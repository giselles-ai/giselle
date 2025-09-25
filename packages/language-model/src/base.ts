import { z } from "zod/v4";

export const Capability = {
	TextGeneration: 1 << 0,
	ImageGeneration: 1 << 1,
	Reasoning: 1 << 2,
	GenericFileInput: 1 << 3,
	PdfFileInput: 1 << 4,
	ImageFileInput: 1 << 5,
	SearchGrounding: 1 << 6,
	OptionalSearchGrounding: 1 << 7,
	ImageGenerationInput: 1 << 8,
	UrlContext: 1 << 9,
} as const;

export const Tier = z.enum(["free", "pro"]);
export type Tier = z.infer<typeof Tier>;

export const TierAccess: Record<Tier, Tier[]> = {
	[Tier.enum.free]: [Tier.enum.free],
	[Tier.enum.pro]: [Tier.enum.free, Tier.enum.pro],
};

export const Capabilities = z.number();

export const LanguageModelBase = z.object({
	provider: z.string(),
	id: z.string(),
	capabilities: Capabilities,
	tier: Tier,
	experimental: z.boolean().optional(),
	configurations: z.unknown(),
});

export type LanguageModelBase = z.infer<typeof LanguageModelBase>;

export type ImageGenerationParams = {
	width: number;
	height: number;
	n: number;
	quality?: "standard" | "hd";
};

export interface UsageCalculator {
	calculateUsage(params: unknown): {
		output: number;
		unit: "IMAGES";
		outputCost?: number;
		totalCost?: number;
	};
}
