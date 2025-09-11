import { AnthropicIcon, GoogleIcon, OpenaiIcon } from "../../../icons";

type Provider = "openai" | "anthropic" | "google" | "perplexity";

export function ProviderIcon({ provider }: { provider: Provider }) {
	switch (provider) {
		case "openai":
			return <OpenaiIcon className="size-[20px] text-black-900" />;
		case "anthropic":
			return <AnthropicIcon className="size-[20px] text-black-900" />;
		case "google":
			return <GoogleIcon className="size-[20px]" />;
		case "perplexity":
			// Perplexity is deprecated, show OpenAI icon as fallback
			return <OpenaiIcon className="size-[20px] text-black-900" />;
		default: {
			const _exhaustiveCheck: never = provider;
			throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
		}
	}
}
