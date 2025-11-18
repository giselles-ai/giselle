import { Tier } from "@giselles-ai/language-model";
import { describe, expect, test } from "vitest";
import type { TeamPlan } from "@/db/schema";
import {
	canUseProLanguageModels,
	getLanguageModelTier,
} from "./language-models";

describe("language model tier helpers", () => {
	const cases = [
		{ plan: "free", tier: Tier.enum.free, canUsePro: false },
		{ plan: "pro", tier: Tier.enum.pro, canUsePro: true },
		{ plan: "team", tier: Tier.enum.pro, canUsePro: true },
		{ plan: "enterprise", tier: Tier.enum.pro, canUsePro: true },
		{ plan: "internal", tier: Tier.enum.pro, canUsePro: true },
	] satisfies Array<{
		plan: TeamPlan;
		tier: Tier;
		canUsePro: boolean;
	}>;

	test.each(cases)("plan %s returns the expected tier", ({ plan, tier }) => {
		expect(getLanguageModelTier(plan)).toBe(tier);
	});

	test.each(cases)(
		"plan %s availability helper mirrors tier",
		({ plan, canUsePro }) => {
			expect(canUseProLanguageModels(plan)).toBe(canUsePro);
		},
	);
});
