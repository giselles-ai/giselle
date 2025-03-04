import {
	type FileData,
	type Node,
	NodeId,
	OutputId,
	type TextGenerationNode,
} from "@giselle-sdk/data-type";
import { isJsonContent, jsonContentToText } from "@giselle-sdk/text-editor";
import type { CoreMessage, DataContent, FilePart } from "ai";

export interface FileIndex {
	nodeId: NodeId;
	start: number;
	end: number;
}

export async function buildMessageObject(
	node: TextGenerationNode,
	contextNodes: Node[],
	fileResolver: (file: FileData) => Promise<DataContent>,
	generationContentResolver: (nodeId: NodeId) => Promise<string | undefined>,
): Promise<CoreMessage[]> {
	switch (node.content.type) {
		case "textGeneration": {
			return await buildGenerationMessageForTextGeneration(
				node,
				contextNodes,
				fileResolver,
				generationContentResolver,
			);
		}
		default: {
			const _exhaustiveCheck: never = node.content.type;
			throw new Error(`Unhandled content type: ${_exhaustiveCheck}`);
		}
	}
}

async function buildGenerationMessageForTextGeneration(
	node: TextGenerationNode,
	contextNodes: Node[],
	fileResolver: (file: FileData) => Promise<DataContent>,
	textGenerationResolver: (nodeId: NodeId) => Promise<string | undefined>,
): Promise<CoreMessage[]> {
	const llmProvider = node.content.llm.provider;
	const prompt = node.content.prompt;
	if (prompt === undefined) {
		throw new Error("Prompt cannot be empty");
	}

	let userMessage = prompt;

	if (isJsonContent(prompt)) {
		userMessage = jsonContentToText(JSON.parse(prompt));
	}

	const pattern = /\{\{(nd-[a-zA-Z0-9]+):(otp-[a-zA-Z0-9]+)\}\}/g;
	const sourceKeywords = [...userMessage.matchAll(pattern)].map((match) => ({
		nodeId: NodeId.parse(match[1]),
		outputId: OutputId.parse(match[2]),
	}));

	const attachedFiles: FilePart[] = [];
	for (const sourceKeyword of sourceKeywords) {
		const contextNode = contextNodes.find(
			(contextNode) => contextNode.id === sourceKeyword.nodeId,
		);
		if (contextNode === undefined) {
			continue;
		}
		const replaceKeyword = `{{${sourceKeyword.nodeId}:${sourceKeyword.outputId}}}`;
		switch (contextNode.content.type) {
			case "text": {
				userMessage = userMessage.replace(
					replaceKeyword,
					contextNode.content.text,
				);
				break;
			}
			case "github":
			case "textGeneration": {
				const result = await textGenerationResolver(contextNode.id);
				if (result !== undefined) {
					userMessage = userMessage.replace(replaceKeyword, result);
				}
				break;
			}
			case "file": {
				switch (contextNode.content.category) {
					case "pdf": {
						const fileContents = await Promise.all(
							contextNode.content.files.map(async (file) => {
								if (file.status !== "uploaded") {
									return null;
								}
								const data = await fileResolver(file);
								return {
									type: "file",
									data,
									mimeType: "application/pdf",
								} satisfies FilePart;
							}),
						).then((results) => results.filter((result) => result !== null));
						if (fileContents.length > 1) {
							userMessage = userMessage.replace(
								replaceKeyword,
								`${getOrdinal(attachedFiles.length + 1)} ~ ${getOrdinal(attachedFiles.length + fileContents.length)} attached files`,
							);
						} else {
							userMessage = userMessage.replace(
								replaceKeyword,
								`${getOrdinal(attachedFiles.length + 1)} attached file`,
							);
						}
						attachedFiles.push(...fileContents);
						break;
					}
					case "text":
						throw new Error("Not implemented");
					default: {
						const _exhaustiveCheck: never = contextNode.content.category;
						throw new Error(`Unhandled category: ${_exhaustiveCheck}`);
					}
				}
			}
		}
	}

	switch (llmProvider) {
		case "openai": {
			return [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: userMessage,
						},
					],
				},
			];
		}
		case "anthropic":
		case "google": {
			return [
				{
					role: "user",
					content: [
						...attachedFiles,
						{
							type: "text",
							text: userMessage,
						},
					],
				},
			];
		}
		default: {
			const _exhaustiveCheck: never = llmProvider;
			throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
		}
	}
}

function getOrdinal(n: number): string {
	const rules = new Intl.PluralRules("en", { type: "ordinal" });
	const suffixes: { [key: string]: string } = {
		one: "st",
		two: "nd",
		few: "rd",
		other: "th",
	};
	const suffix = suffixes[rules.select(n)];
	return `${n}${suffix}`;
}
