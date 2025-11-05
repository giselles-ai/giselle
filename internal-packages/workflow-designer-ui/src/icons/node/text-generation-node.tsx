import type { TextGenerationLanguageModelProvider } from "@giselles-ai/protocol";
import type { SVGProps } from "react";
import { AnthropicIcon } from "../anthropic";
import { GoogleWhiteIcon } from "../google";
import { OpenaiIcon } from "../openai";
import { PerplexityIcon } from "../perplexity";

function _TextGenerationNodeIcon({
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
