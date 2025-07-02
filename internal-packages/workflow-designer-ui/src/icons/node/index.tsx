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
import { DatabaseZapIcon } from "lucide-react";
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
import { TriggerIcon } from "../trigger";
import { WebPageFileIcon } from "../web-page-file";

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
							return <TriggerIcon {...props} data-content-type-icon />;
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
				case "vectorStore":
					if (!isVectorStoreNode(node)) {
						throw new Error(
							`Expected VectorStoreNode, got ${JSON.stringify(node)}`,
						);
					}
					switch (node.content.source.provider) {
						case "github":
							return <GitHubIcon {...props} data-content-type-icon />;
						default: {
							const _exhaustiveCheck: never = node.content.source.provider;
							throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
						}
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
