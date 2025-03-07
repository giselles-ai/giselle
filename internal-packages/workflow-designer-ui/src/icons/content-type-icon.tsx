import type { FileCategory } from "@giselle-sdk/data-type";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import type { SVGProps } from "react";
import { PromptIcon } from "../icons/prompt";
import { AnthropicIcon } from "./anthropic";
import { GoogleWhiteIcon } from "./google";
import { OpenaiIcon } from "./openai";
import { PdfFileIcon } from "./pdf-file";
import { PictureIcon } from "./picture";
import { TextFileIcon } from "./text-file";

interface TextNodeIconProps extends SVGProps<SVGSVGElement> {
	contentType: "text";
	llmProvider?: never;
	fileCategory?: never;
}
interface FileNodeIconProps extends SVGProps<SVGSVGElement> {
	contentType: "file";
	llmProvider?: never;
	fileCategory: FileCategory;
}
interface TextGenerationNodeIconProps extends SVGProps<SVGSVGElement> {
	contentType: "textGeneration";
	llmProvider: LanguageModelProvider;
	fileCategory?: never;
}
export type ContentTypeIconProps =
	| TextNodeIconProps
	| TextGenerationNodeIconProps
	| FileNodeIconProps;

export function ContentTypeIcon({
	contentType,
	llmProvider,
	fileCategory,
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
				default: {
					const _exhaustiveCheck: never = llmProvider;
					throw new Error(`Unhandled LLMProvider: ${_exhaustiveCheck}`);
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
				default: {
					const _exhaustiveCheck: never = fileCategory;
					throw new Error(`Unhandled FileCategory: ${_exhaustiveCheck}`);
				}
			}
		default: {
			const _exhaustiveCheck: never = contentType;
			throw new Error(`Unhandled ContentType: ${_exhaustiveCheck}`);
		}
	}
}
