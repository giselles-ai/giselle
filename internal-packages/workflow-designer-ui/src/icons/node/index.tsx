import {
	isActionNode,
	isFileNode,
	isImageGenerationNode,
	isTextGenerationNode,
	isTriggerNode,
	isVectorStoreNode,
	type NodeLike,
} from "@giselle-sdk/data-type";
import { getImageGenerationModelProvider } from "@giselle-sdk/language-model";
import { DatabaseZapIcon, ZapIcon } from "lucide-react";
import type { SVGProps } from "react";
import { SearchIcon } from "..";
import { AnthropicIcon } from "../anthropic";
import { Flux1Icon } from "../flux1";
import { GitHubIcon } from "../github";
import { GoogleIcon, GoogleWhiteIcon } from "../google";
import { IdegramIcon } from "../ideogram";
import { OpenaiIcon } from "../openai";
import { PdfFileIcon } from "../pdf-file";
import { PerplexityIcon } from "../perplexity";
import { PictureIcon } from "../picture";
import { PromptIcon } from "../prompt";
import { RecraftIcon } from "../recraft";
import { StableDiffusionIcon } from "../stable-diffusion";
import { TextFileIcon } from "../text-file";

import { WebPageFileIcon } from "../web-page-file";

// Node-specific GitHub icon with dark fill for visibility on light backgrounds
function NodeGitHubIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
	return (
		<svg
			width="98"
			height="96"
			viewBox="0 0 98 96"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="graphics-symbol"
			className={className}
			{...props}
		>
			<path
				fill="hsl(229, 100%, 2%)"
				fillRule="evenodd"
				clipRule="evenodd"
				d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
			/>
		</svg>
	);
}

export * from "./file-node";
export * from "./image-generation-node";
export * from "./text-generation-node";

export function NodeIcon({
	node,
	...props
}: { node: NodeLike } & SVGProps<SVGSVGElement>) {
	switch (node.type) {
		case "operation": {
			switch (node.content.type) {
				case "textGeneration":
					if (!isTextGenerationNode(node)) {
						throw new Error(
							`Expected TextGenerationNode, got ${JSON.stringify(node)}`,
						);
					}
					switch (node.content.llm.provider) {
						case "openai":
							return <OpenaiIcon {...props} data-content-type-icon />;
						case "anthropic":
							return <AnthropicIcon {...props} data-content-type-icon />;
						case "google":
							// Gemini brand guidelines require using either white or colored icons without modification
							// See: https://about.google/brand-resource-center/brand-elements/
							if (/text-white/.test(props.className ?? "")) {
								return <GoogleWhiteIcon {...props} data-content-type-icon />;
							}
							return <GoogleIcon {...props} data-content-type-icon />;
						case "perplexity":
							return <PerplexityIcon {...props} data-content-type-icon />;
						default: {
							const _exhaustiveCheck: never = node.content.llm;
							throw new Error(`Unhandled LLMProvider: ${_exhaustiveCheck}`);
						}
					}
				case "imageGeneration": {
					if (!isImageGenerationNode(node)) {
						throw new Error(
							`Expected ImageGenerationNode, got ${JSON.stringify(node)}`,
						);
					}
					switch (node.content.llm.provider) {
						case "fal": {
							const imageModelProvider = getImageGenerationModelProvider(
								node.content.llm.id,
							);
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
									return (
										<StableDiffusionIcon {...props} data-content-type-icon />
									);
								default: {
									const _exhaustiveCheck: never = imageModelProvider;
									throw new Error(
										`Unhandled ImageModelProvider: ${_exhaustiveCheck}`,
									);
								}
							}
						}
						case "openai":
							return <OpenaiIcon {...props} data-content-type-icon />;
						case "google":
							// Gemini brand guidelines require using either white or colored icons without modification
							// See: https://about.google/brand-resource-center/brand-elements/
							if (/text-white/.test(props.className ?? "")) {
								return <GoogleWhiteIcon {...props} data-content-type-icon />;
							}
							return <GoogleIcon {...props} data-content-type-icon />;
						default: {
							const _exhaustiveCheck: never = node.content.llm;
							throw new Error(`Unhandled LLMProvider: ${_exhaustiveCheck}`);
						}
					}
				}
				case "trigger": {
					if (!isTriggerNode(node)) {
						throw new Error(
							`Expected TriggerNode, got ${JSON.stringify(node)}`,
						);
					}
					switch (node.content.provider) {
						case "github":
							return <GitHubIcon {...props} data-content-type-icon />;
						case "manual":
							return <ZapIcon {...props} data-content-type-icon />;
						default: {
							const _exhaustiveCheck: never = node.content;
							throw new Error(
								`Unhandled TriggerProviderType: ${_exhaustiveCheck}`,
							);
						}
					}
				}
				case "action": {
					if (!isActionNode(node)) {
						throw new Error(`Expected ActionNode, got ${JSON.stringify(node)}`);
					}
					switch (node.content.command.provider) {
						case "github":
							return <GitHubIcon {...props} data-content-type-icon />;
						case "web-search":
							return <SearchIcon {...props} data-content-type-icon />;
						default: {
							const _exhaustiveCheck: never = node.content.command;
							throw new Error(
								`Unhandled TriggerProviderType: ${_exhaustiveCheck}`,
							);
						}
					}
				}
				case "query":
					return <DatabaseZapIcon {...props} data-content-type-icon />;
				default: {
					const _exhaustiveCheck: never = node.content.type;
					throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
				}
			}
		}
		case "variable":
			switch (node.content.type) {
				case "text":
					return <PromptIcon {...props} data-content-type-icon />;
				case "file":
					if (!isFileNode(node)) {
						throw new Error(`Expected FileNode, got ${JSON.stringify(node)}`);
					}
					switch (node.content.category) {
						case "pdf":
							return <PdfFileIcon {...props} data-content-type-icon />;
						case "text":
							return <TextFileIcon {...props} data-content-type-icon />;
						case "image":
							return <PictureIcon {...props} data-content-type-icon />;
						default: {
							const _exhaustiveCheck: never = node.content.category;
							throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
						}
					}
				case "webPage":
					return <WebPageFileIcon {...props} data-content-type-icon />;
				case "github":
					return <GitHubIcon {...props} />;
				case "vectorStore": {
					if (!isVectorStoreNode(node)) {
						throw new Error(
							`Expected VectorStoreNode, got ${JSON.stringify(node)}`,
						);
					}
					return <NodeGitHubIcon {...props} data-content-type-icon />;
				}
				default: {
					const _exhaustiveCheck: never = node.content.type;
					throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
				}
			}
		default: {
			const _exhaustiveCheck: never = node;
			throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
		}
	}
}
