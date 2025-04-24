import type { SearchContextSize } from "./pricing";

export type TokenUsage = {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
};

export type ImageCountUsage = {
	images: number;
};

export type ImageSizeUsage = {
	megaPixels: number;
};

export type ImageUsage = ImageCountUsage | ImageSizeUsage;

export type ApiCallUsage = {
	calls: number;
};

export type ModelUsage = TokenUsage | ImageUsage | ApiCallUsage;
