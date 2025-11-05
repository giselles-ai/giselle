import type { Tier } from "@giselles-ai/language-model";

export interface UsageLimits {
	featureTier: Tier;
	resourceLimits: {
		agentTime: {
			limit: number; // in milliseconds
			used: number; // in milliseconds
		};
	};
}
