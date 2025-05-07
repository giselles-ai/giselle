import type { SearchContextSize } from "./pricing";

export type TokenUsage = {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
};

export type ImageCountUsage = {
	nOfImages: number;
};

export type ImageSizeUsage = {
	pixelDimensions: string;
};

export type ImageUsage = ImageCountUsage | ImageSizeUsage;

export type ApiCallUsage = {
	calls: number;
};

export type ModelUsage = TokenUsage | ImageUsage | ApiCallUsage;
