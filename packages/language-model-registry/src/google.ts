import * as z from "zod/v4";
import {
	type AnyLanguageModel,
	defineLanguageModel,
	definePricing,
} from "./language-model";
import { googleProvider } from "./providers";

export const google = {
	"google/gemini-3-pro-preview": defineLanguageModel({
		provider: googleProvider,
		id: "google/gemini-3-pro-preview",
		name: "Gemini 3 Pro Preview",
		description:
			"This model improves upon Gemini 2.5 Pro and is catered towards challenging tasks, especially those involving complex reasoning or agentic workflows. ",
		contextWindow: 1_048_576,
		maxOutputTokens: 65_536,
		knowledgeCutoff: new Date(2025, 0, 31).getTime(),
		pricing: {
			input: definePricing(2.0),
			output: definePricing(12.0),
		},
		requiredTier: "pro",
		configurationOptions: {
			temperature: {
				description: "Controls the randomness of the output.",
				schema: z.number().min(0.0).max(2.0),
				ui: {
					min: 0.0,
					max: 2.0,
					step: 0.05,
				},
			},
			thinkingLevel: {
				description:
					"Control thinking behavior. Models adjust reasoning effort dynamically by default, but you can override this for specific latency or complexity requirements.",
				schema: z.enum(["low", "high"]),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			thinkingLevel: "high",
		},
		url: "https://ai.google.dev/gemini-api/docs/models",
	}),
	"google/gemini-2.5-pro": defineLanguageModel({
		provider: googleProvider,
		id: "google/gemini-2.5-pro",
		name: "Gemini 2.5 Pro",
		description:
			"Gemini 2.5 Pro is our most advanced reasoning Gemini model, capable of solving complex problems. Gemini 2.5 Pro can comprehend vast datasets and challenging problems from different information sources, including text, audio, images, video, and even entire code repositories.",
		contextWindow: 1_048_576,
		maxOutputTokens: 65_536,
		knowledgeCutoff: new Date(2025, 0, 31).getTime(),
		pricing: {
			input: definePricing(1.25),
			output: definePricing(10.0),
		},
		requiredTier: "pro",
		configurationOptions: {
			temperature: {
				description: "Controls the randomness of the output.",
				schema: z.number().min(0.0).max(2.0),
				ui: {
					min: 0.0,
					max: 2.0,
					step: 0.05,
				},
			},
			thinking: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			thinking: true,
		},
		url: "https://ai.google.dev/gemini-api/docs/models",
	}),
	"google/gemini-2.5-flash": defineLanguageModel({
		provider: googleProvider,
		id: "google/gemini-2.5-flash",
		name: "Gemini 2.5 Flash",
		description:
			"Gemini 2.5 Flash is a thinking model that offers great, well-rounded capabilities. It is designed to offer a balance between price and performance with multimodal support and a 1M token context window.",
		contextWindow: 1_048_576,
		maxOutputTokens: 65_536,
		knowledgeCutoff: new Date(2025, 0, 31).getTime(),
		pricing: {
			input: definePricing(0.1),
			output: definePricing(0.4),
		},
		requiredTier: "pro",
		configurationOptions: {
			temperature: {
				description: "Controls the randomness of the output.",
				schema: z.number().min(0.0).max(2.0),
				ui: {
					min: 0.0,
					max: 2.0,
					step: 0.1,
				},
			},
			thinking: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 1.0,
			thinking: true,
		},
		url: "https://ai.google.dev/gemini-api/docs/models",
	}),
	"google/gemini-2.5-flash-lite": defineLanguageModel({
		provider: googleProvider,
		id: "google/gemini-2.5-flash-lite",
		name: "Gemini 2.5 Flash Lite",
		description:
			"Gemini 2.5 Flash-Lite is a balanced, low-latency model with configurable thinking budgets and tool connectivity (e.g., Google Search grounding and code execution). It supports multimodal input and offers a 1M-token context window.",
		contextWindow: 1_048_576,
		maxOutputTokens: 65_536,
		knowledgeCutoff: new Date(2025, 0, 31).getTime(),
		pricing: {
			input: definePricing(0.1),
			output: definePricing(0.4),
		},
		requiredTier: "free",
		configurationOptions: {
			temperature: {
				description: "Controls the randomness of the output.",
				schema: z.number().min(0.0).max(2.0),
				ui: {
					min: 0.0,
					max: 2.0,
					step: 0.1,
				},
			},
			thinking: {
				description: "Whether to include reasoning text in the response.",
				schema: z.boolean(),
			},
		},
		defaultConfiguration: {
			temperature: 0.7,
			thinking: false,
		},
		url: "https://ai.google.dev/gemini-api/docs/models",
	}),
} as const satisfies Record<string, AnyLanguageModel>;
