export const OPENAI_MODELS = {
	GPT4O: "gpt-4o",
	GPT4O_MINI: "gpt-4o-mini",
	O1_PREVIEW: "o1-preview",
	O1_MINI: "o1-mini",
	O3: "o3",
	O3_MINI: "o3-mini",
	O4_MINI: "o4-mini",
	GPT4_1: "gpt-4.1",
	GPT4_1_MINI: "gpt-4.1-mini",
	GPT4_1_NANO: "gpt-4.1-nano",
} as const;

export const ANTHROPIC_MODELS = {
	CLAUDE4_OPUS: "claude-4-opus-20250514",
	CLAUDE4_SONNET: "claude-4-sonnet-20250514",
	CLAUDE3_7_SONNET: "claude-3-7-sonnet-20250219",
	CLAUDE3_5_SONNET: "claude-3-5-sonnet-20241022",
	CLAUDE3_5_HAIKU: "claude-3-5-haiku-20241022",
} as const;

export const GOOGLE_MODELS = {
	GEMINI_25_PRO_EXP: "gemini-2.5-pro-exp-03-25",
	GEMINI_25_PRO_PREVIEW: "gemini-2.5-pro-preview-03-25",
	GEMINI_25_FLASH_PREVIEW: "gemini-2.5-flash-preview-04-17",
	GEMINI_20_FLASH: "gemini-2.0-flash",
	GEMINI_20_FLASH_LITE_PREVIEW: "gemini-2.0-flash-lite-preview-02-05",
	GEMINI_20_FLASH_THINKING_EXP: "gemini-2.0-flash-thinking-exp-01-21",
	GEMINI_20_PRO_EXP: "gemini-2.0-pro-exp-02-05",
} as const;

export type OpenAIModel = typeof OPENAI_MODELS[keyof typeof OPENAI_MODELS];
export type AnthropicModel = typeof ANTHROPIC_MODELS[keyof typeof ANTHROPIC_MODELS];
export type GoogleModel = typeof GOOGLE_MODELS[keyof typeof GOOGLE_MODELS];
