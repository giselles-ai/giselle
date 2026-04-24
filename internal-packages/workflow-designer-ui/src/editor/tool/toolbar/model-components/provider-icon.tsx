import type { LanguageModel } from "@giselles-ai/language-model";
import { AnthropicIcon, GoogleWhiteIcon, OpenaiIcon } from "../components";

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
		default:
			return null;
	}
}
