import type { TextGenerationLanguageModelProvider } from "@giselle-sdk/data-type";
import type { SVGProps } from "react";
import { AnthropicIcon } from "../anthropic";
import { GoogleWhiteIcon } from "../google";
import { OpenaiIcon } from "../openai";
import { PerplexityIcon } from "../perplexity";

export function TextGenerationNodeIcon({
	llmProvider,
	...props
}: {
	llmProvider: TextGenerationLanguageModelProvider;
} & SVGProps<SVGSVGElement>) {
	switch (llmProvider) {
		case "openai":
			return <OpenaiIcon {...props} />;
		case "anthropic":
			return <AnthropicIcon {...props} />;
		case "google":
			return <GoogleWhiteIcon {...props} />;
		case "perplexity":
			return <PerplexityIcon {...props} />;
		default: {
			const _exhaustiveCheck: never = llmProvider;
			throw new Error(`Unhandled LLMProvider: ${_exhaustiveCheck}`);
		}
	}
}
