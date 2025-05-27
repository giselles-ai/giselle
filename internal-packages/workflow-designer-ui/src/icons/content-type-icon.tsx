import type {
	FileCategory,
	ImageGenerationContent,
	TextGenerationContent,
} from "@giselle-sdk/data-type";
import { getImageGenerationModelProvider } from "@giselle-sdk/language-model";
import type { SVGProps } from "react";
import { PromptIcon } from "../icons/prompt";
import { AnthropicIcon } from "./anthropic";
import { Flux1Icon } from "./flux1";
import { GitHubIcon } from "./github";
import { GoogleWhiteIcon } from "./google";
import { IdegramIcon } from "./ideogram";
import { OpenaiIcon } from "./openai";
import { PdfFileIcon } from "./pdf-file";
import { PerplexityIcon } from "./perplexity";
import { PictureIcon } from "./picture";
import { RecraftIcon } from "./recraft";
import { StableDiffusionIcon } from "./stable-diffusion";
import { TextFileIcon } from "./text-file";
import { WebPageFileIcon } from "./web-page-file";

interface TextNodeIconProps extends SVGProps<SVGSVGElement> {
	contentType: "text";
	llmProvider?: never;
	fileCategory?: never;
	modelId?: never;
}
interface FileNodeIconProps extends SVGProps<SVGSVGElement> {
	contentType: "file";
	llmProvider?: never;
	fileCategory: FileCategory;
	modelId?: never;
}
interface TextGenerationNodeIconProps extends SVGProps<SVGSVGElement> {
	contentType: "textGeneration";
	llmProvider: TextGenerationContent["llm"]["provider"];
	fileCategory?: never;
	modelId?: never;
}
interface ImageGenerationNodeIconProps extends SVGProps<SVGSVGElement> {
	contentType: "imageGeneration";
	llmProvider: ImageGenerationContent["llm"]["provider"];
	modelId: string;
	fileCategory?: never;
}
interface GitHubNodeIconProps extends SVGProps<SVGSVGElement> {
	contentType: "github";
	llmProvider?: never;
	fileCategory?: never;
	modelId?: never;
}
export type ContentTypeIconProps =
	| TextNodeIconProps
	| TextGenerationNodeIconProps
	| ImageGenerationNodeIconProps
	| FileNodeIconProps
	| GitHubNodeIconProps;

export function ContentTypeIcon({
	contentType,
	llmProvider,
	fileCategory,
	modelId,
	...props
}: ContentTypeIconProps) {
	switch (contentType) {
		case "textGeneration":
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
		case "imageGeneration": {
			const imageModelProvider = getImageGenerationModelProvider(modelId);
			if (imageModelProvider === undefined) {
				return null;
			}
			switch (imageModelProvider) {
				case "flux":
					return <Flux1Icon {...props} data-content-type-icon />;
				case "recraft":
					return <RecraftIcon {...props} data-content-type-icon />;
				case "ideogram":
					return <IdegramIcon {...props} data-content-type-icon />;
				case "stable-diffusion":
					return <StableDiffusionIcon {...props} data-content-type-icon />;
				default: {
					const _exhaustiveCheck: never = imageModelProvider;
					throw new Error(`Unhandled ImageModelProvider: ${_exhaustiveCheck}`);
				}
			}
		}
		case "text":
			return <PromptIcon {...props} />;
		case "file":
			switch (fileCategory) {
				case "pdf":
					return <PdfFileIcon {...props} />;
				case "text":
					return <TextFileIcon {...props} />;
				case "image":
					return <PictureIcon {...props} />;
				case "webPage":
					return <WebPageFileIcon {...props} />;
				default: {
					const _exhaustiveCheck: never = fileCategory;
					throw new Error(`Unhandled FileCategory: ${_exhaustiveCheck}`);
				}
			}
		case "github":
			return <GitHubIcon {...props} />;
		default: {
			const _exhaustiveCheck: never = contentType;
			throw new Error(`Unhandled ContentType: ${_exhaustiveCheck}`);
		}
	}
}
