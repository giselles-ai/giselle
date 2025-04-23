import type { SearchContextSize } from "./pricing";

export type TokenUsage = {
  type: "token";
  inputTokens: number;
  outputTokens: number;
};

export type ImageCountUsage = {
  type: "image_count";
  images: number;
};

export type ImageSizeUsage = {
  type: "image_size";
  megaPixels: number;
};

export type ImageUsage = ImageCountUsage | ImageSizeUsage;

export type WebSearchUsage = {
  type: "web_search";
  calls: number;
  contextSize: SearchContextSize;
};

export type ModelUsage = TokenUsage | ImageUsage | WebSearchUsage;
