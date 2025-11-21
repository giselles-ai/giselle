import {
	getEntry,
	type LanguageModelId,
} from "@giselles-ai/language-model-registry";
import { AnthropicIcon, GoogleWhiteIcon, OpenaiIcon } from "../components";

interface ProviderIconProps {
	modelId: LanguageModelId;
	className?: string;
}

export function ProviderIcon({
	modelId,
	className = "w-[18px] h-[18px]",
}: ProviderIconProps) {
	const languageModel = getEntry(modelId);
	switch (languageModel.provider) {
		case "anthropic":
			return <AnthropicIcon className={className} data-icon />;
		case "openai":
			return <OpenaiIcon className={className} data-icon />;
		case "google":
			return <GoogleWhiteIcon className={className} data-icon />;
		default: {
			const _exhaustiveCheck: never = languageModel;
			throw new Error(`Unknown provider: ${_exhaustiveCheck}`);
		}
	}
}
