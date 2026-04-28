import {
	AnthropicIcon,
	GoogleWhiteIcon,
	OpenaiIcon,
} from "../../../../../../internal-packages/workflow-designer-ui/src/icons";

export function LLMProviderIcon({
	provider,
	className,
}: {
	provider: string;
	className?: string;
}) {
	switch (provider) {
		case "openai":
			return <OpenaiIcon className={className} />;
		case "anthropic":
			return <AnthropicIcon className={className} />;
		case "google":
			return <GoogleWhiteIcon className={className} />;
		default:
			return null;
	}
}
