import type { LanguageModel } from "@giselle-sdk/language-model";
import {
	AnthropicIcon,
	GoogleWhiteIcon,
	ImageGenerationNodeIcon,
	OpenaiIcon,
	PerplexityIcon,
} from "../components";

interface ProviderIconProps {
	model: LanguageModel;
	className?: string;
}

export function ProviderIcon({
	model,
	className = "w-[18px] h-[18px]",
}: ProviderIconProps) {
	switch (model.provider) {
		case "anthropic":
			return <AnthropicIcon className={className} data-icon />;
		case "openai":
			return <OpenaiIcon className={className} data-icon />;
		case "google":
			return <GoogleWhiteIcon className={className} data-icon />;
		case "perplexity":
			return <PerplexityIcon className={className} data-icon />;
		case "fal":
			return (
				<ImageGenerationNodeIcon
					modelId={model.id}
					className={className}
					data-icon
				/>
			);
		default:
			return null;
	}
}
