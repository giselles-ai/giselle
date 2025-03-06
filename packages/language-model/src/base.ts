import { z } from "zod";

export const Capability = {
	TextGeneration: 1 << 0,
	ImageGeneration: 1 << 1,
	Reasoning: 1 << 2,
	GenericFileInput: 1 << 3,
	PdfFileInput: 1 << 4,
	ImageFileInput: 1 << 5,
	SearchGrounding: 1 << 6,
} as const;

export const Tier = z.enum(["free", "plus", "pro"]);
export type Tier = z.infer<typeof Tier>;

export const TierAccess: Record<Tier, Tier[]> = {
	[Tier.enum.free]: [Tier.enum.free],
	[Tier.enum.plus]: [Tier.enum.free, Tier.enum.plus],
	[Tier.enum.pro]: [Tier.enum.free, Tier.enum.plus, Tier.enum.pro],
};

type Capabilities = number;

export const Capabilities = z.number();

export const LanguageModelBase = z.object({
	provider: z.string(),
	id: z.string(),
	capabilities: Capabilities,
	tier: Tier,
	experimental: z.boolean().optional(),
	configurations: z.record(z.string(), z.any()),
});

export type LanguageModelBase = z.infer<typeof LanguageModelBase>;
