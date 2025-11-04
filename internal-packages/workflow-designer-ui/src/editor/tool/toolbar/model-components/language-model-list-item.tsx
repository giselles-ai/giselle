import type { LanguageModel } from "@giselle-ai/language-model";
import clsx from "clsx/lite";
import type { ToggleGroup } from "radix-ui";
import {
	AnthropicIcon,
	GoogleWhiteIcon,
	ImageGenerationNodeIcon,
	OpenaiIcon,
	PerplexityIcon,
	ProTag,
} from "../components";

function _LanguageModelListItem({
	languageModel,
	...props
}: Omit<ToggleGroup.ToggleGroupItemProps, "value"> & {
	languageModel: LanguageModel;
}) {
	return (
		<button
			{...props}
			className={clsx(
				"flex gap-[8px]",
				"hover:bg-bg-850/10 focus:bg-bg-850/10 p-[4px] rounded-[4px]",
				"data-[state=on]:bg-primary-900 focus:outline-none",
				"**:data-icon:w-[16px] **:data-icon:h-[16px] **:data-icon:text-inverse ",
			)}
		>
			<div className="flex gap-[12px] items-center">
				{languageModel.provider === "anthropic" && (
					<AnthropicIcon className="w-[18px] h-[18px]" data-icon />
				)}
				{languageModel.provider === "openai" && (
					<OpenaiIcon className="w-[18px] h-[18px]" data-icon />
				)}
				{languageModel.provider === "google" && (
					<GoogleWhiteIcon className="w-[18px] h-[18px]" data-icon />
				)}
				{languageModel.provider === "perplexity" && (
					<PerplexityIcon className="w-[18px] h-[18px]" data-icon />
				)}
				{languageModel.provider === "fal" && (
					<ImageGenerationNodeIcon
						modelId={languageModel.id}
						className="w-[18px] h-[18px]"
						data-icon
					/>
				)}
				<div className="flex items-center gap-[8px]">
					<p className="text-[14px] text-left text-nowrap">
						{languageModel.id}
					</p>
					{languageModel.tier === "pro" && <ProTag />}
				</div>
			</div>
		</button>
	);
}
