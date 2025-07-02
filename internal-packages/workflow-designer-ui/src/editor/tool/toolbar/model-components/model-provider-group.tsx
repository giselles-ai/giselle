import type { LanguageModel } from "@giselle-sdk/language-model";
import {
	AnthropicIcon,
	GoogleWhiteIcon,
	ImageGenerationNodeIcon,
	OpenaiIcon,
	PerplexityIcon,
	ProTag,
} from "../components";

export function ModelProviderGroup({
	provider,
	models,
	onModelSelect,
}: {
	provider: string;
	models: LanguageModel[];
	onModelSelect: (model: LanguageModel) => void;
}) {
	const getProviderName = (prov: string) => {
		switch (prov) {
			case "openai":
				return "OpenAI";
			case "anthropic":
				return "Claude";
			case "google":
				return "Google";
			default:
				return prov.charAt(0).toUpperCase() + prov.slice(1);
		}
	};
	return (
		<div className="flex flex-col gap-[8px] mb-[16px]">
			<h3 className="text-white-400 text-[14px] px-[4px]">
				{getProviderName(provider)}
			</h3>
			<div className="flex flex-col gap-[4px]">
				{models.map((model) => (
					<button
						type="button"
						key={model.id}
						className="flex gap-[12px] items-center hover:bg-white-850/10 focus:bg-white-850/10 p-[4px] rounded-[4px]"
						onClick={() => onModelSelect(model)}
					>
						<div className="flex items-center">
							{provider === "anthropic" && (
								<AnthropicIcon className="w-[18px] h-[18px]" data-icon />
							)}
							{provider === "openai" && (
								<OpenaiIcon className="w-[18px] h-[18px]" data-icon />
							)}
							{provider === "google" && (
								<GoogleWhiteIcon className="w-[18px] h-[18px]" data-icon />
							)}
							{provider === "perplexity" && (
								<PerplexityIcon className="w-[18px] h-[18px]" data-icon />
							)}
							{provider === "fal" && (
								<ImageGenerationNodeIcon
									modelId={model.id}
									className="w-[18px] h-[18px]"
									data-icon
								/>
							)}
						</div>
						<div className="flex items-center gap-[8px]">
							<p className="text-[14px] text-left text-nowrap">{model.id}</p>
							{model.tier === "pro" && <ProTag />}
						</div>
					</button>
				))}
			</div>
		</div>
	);
}
