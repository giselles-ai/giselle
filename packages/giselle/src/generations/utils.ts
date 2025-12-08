import { hasTierAccess, languageModels } from "@giselles-ai/language-model";
import {
	type CompletedGeneration,
	type ContentGenerationNode,
	type FileContent,
	type FileId,
	Generation,
	GenerationContext,
	type GenerationId,
	type GenerationOutput,
	type ImageGenerationNode,
	isImageGenerationNode,
	isTextGenerationNode,
	type Node,
	NodeGenerationIndex,
	NodeId,
	type OperationNode,
	OutputId,
	type TextGenerationNode,
	type WebPageContent,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import {
	isJsonContent,
	jsonContentToText,
} from "@giselles-ai/text-editor-utils";
import type { DataContent, FilePart, ImagePart, ModelMessage } from "ai";
import type { GiselleContext } from "../types";
import type { AppEntryResolver } from "./types";

interface GeneratedImageData {
	uint8Array: Uint8Array;
	base64: string;
}

export async function buildMessageObject({
	node,
	contextNodes,
	fileResolver,
	generationContentResolver,
	imageGenerationResolver,
	appEntryResolver,
}: {
	node: OperationNode;
	contextNodes: Node[];
	fileResolver: (fileId: FileId) => Promise<DataContent>;
	generationContentResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>;
	imageGenerationResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<ImagePart[] | undefined>;
	appEntryResolver: AppEntryResolver;
}): Promise<ModelMessage[]> {
	switch (node.content.type) {
		case "textGeneration": {
			return await buildGenerationMessageForTextGeneration({
				node: node as TextGenerationNode,
				contextNodes,
				fileResolver,
				generationContentResolver,
				appEntryResolver,
			});
		}
		case "contentGeneration": {
			return await buildGenerationMessageForContentGeneration({
				node: node as ContentGenerationNode,
				contextNodes,
				fileResolver,
				generationContentResolver,
				appEntryResolver,
			});
		}
		case "imageGeneration": {
			return await buildGenerationMessageForImageGeneration(
				node as ImageGenerationNode,
				contextNodes,
				fileResolver,
				generationContentResolver,
				imageGenerationResolver,
				appEntryResolver,
			);
		}
		case "end":
		case "action":
		case "trigger":
		case "query":
		case "appEntry": {
			return [];
		}
		default: {
			const _exhaustiveCheck: never = node.content;
			throw new Error(`Unhandled content type: ${_exhaustiveCheck}`);
		}
	}
}

async function buildGenerationMessageForTextGeneration({
	node,
	contextNodes,
	fileResolver,
	generationContentResolver,
	appEntryResolver,
}: {
	node: TextGenerationNode;
	contextNodes: Node[];
	fileResolver: (fileId: FileId) => Promise<DataContent>;
	generationContentResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>;
	appEntryResolver: AppEntryResolver;
}): Promise<ModelMessage[]> {
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

	const attachedFiles: (FilePart | ImagePart)[] = [];
	const attachedFileNodeIds: NodeId[] = [];
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
				const jsonOrText = contextNode.content.text;
				const text = isJsonContent(jsonOrText)
					? jsonContentToText(JSON.parse(jsonOrText))
					: jsonOrText;
				userMessage = userMessage.replace(replaceKeyword, text);
				break;
			}
			case "textGeneration":
			case "contentGeneration": {
				const result = await generationContentResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				// If there is no matching Output, replace it with an empty string (remove the pattern string from userMessage)
				userMessage = userMessage.replace(replaceKeyword, result ?? "");
				break;
			}
			case "file":
				if (
					attachedFileNodeIds.some(
						(attachedFileNodeId) => contextNode.id === attachedFileNodeId,
					)
				) {
					continue;
				}
				switch (contextNode.content.category) {
					case "text": {
						const fileContents = await getFileContents(
							contextNode.content,
							fileResolver,
						);
						userMessage = userMessage.replace(
							replaceKeyword,
							fileContents
								.map((fileContent) => {
									if (fileContent.type === "image") {
										return null;
									}
									if (!(fileContent.data instanceof Uint8Array)) {
										return null;
									}
									const text = new TextDecoder().decode(fileContent.data);
									return `<File name=${fileContent.filename}>${text}</File>`;
								})
								.filter((data) => data !== null)
								.join(),
						);

						break;
					}
					case "image":
					case "pdf": {
						const fileContents = await getFileContents(
							contextNode.content,
							fileResolver,
						);
						userMessage = userMessage.replace(
							replaceKeyword,
							getFilesDescription(attachedFiles.length, fileContents.length),
						);

						attachedFiles.push(...fileContents);
						attachedFileNodeIds.push(contextNode.id);
						break;
					}
					default: {
						const _exhaustiveCheck: never = contextNode.content.category;
						throw new Error(`Unhandled category: ${_exhaustiveCheck}`);
					}
				}
				break;

			case "github":
			case "imageGeneration":
			case "vectorStore":
				throw new Error("Not implemented");

			case "webPage": {
				const fileContents = await geWebPageContents(
					contextNode.content,
					fileResolver,
				);
				switch (llmProvider) {
					case "anthropic":
					case "openai":
					case "perplexity":
						userMessage = userMessage.replace(
							replaceKeyword,
							fileContents
								.map((fileContent) => {
									if (fileContent.type !== "file") {
										return null;
									}
									if (
										!(
											fileContent.data instanceof Uint8Array ||
											fileContent.data instanceof ArrayBuffer
										)
									) {
										return null;
									}
									const text = new TextDecoder().decode(fileContent.data);
									return `<WebPage name=${fileContent.filename}>${text}</WebPage>`;
								})
								.filter((data): data is string => data !== null)
								.join(),
						);
						break;
					case "google":
						userMessage = userMessage.replace(
							replaceKeyword,
							getFilesDescription(attachedFiles.length, fileContents.length),
						);

						attachedFiles.push(...fileContents);
						attachedFileNodeIds.push(contextNode.id);
						break;
					default: {
						const _exhaustiveCheck: never = llmProvider;
						throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
					}
				}
				break;
			}

			case "query":
			case "trigger":
			case "action": {
				const result = await generationContentResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				// If there is no matching Output, replace it with an empty string (remove the pattern string from userMessage)
				userMessage = userMessage.replace(replaceKeyword, result ?? "");
				break;
			}
			case "end": {
				userMessage = userMessage.replace(replaceKeyword, "");
				break;
			}
			case "appEntry": {
				const result = appEntryResolver(
					sourceKeyword.nodeId,
					sourceKeyword.outputId,
				);

				userMessage = userMessage.replace(
					replaceKeyword,
					result === undefined ? "" : `${result}`,
				);
				break;
			}
			default: {
				const _exhaustiveCheck: never = contextNode.content;
				throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
			}
		}
	}
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

export function generationPath(generationId: GenerationId) {
	return `generations/${generationId}/generation.json`;
}

export async function getGeneration(params: {
	storage: GiselleStorage;
	generationId: GenerationId;
}): Promise<Generation | undefined> {
	const generation = await params.storage.getJson({
		path: generationPath(params.generationId),
		schema: Generation,
	});
	const parsedGenerationContext = GenerationContext.parse(generation.context);
	return {
		...generation,
		context: parsedGenerationContext,
	};
}

export function nodeGenerationIndexPath(nodeId: NodeId) {
	return `generations/byNode/${nodeId}.json`;
}

export async function getNodeGenerationIndexes(params: {
	storage: GiselleStorage;
	nodeId: NodeId;
}) {
	if (!(await params.storage.exists(nodeGenerationIndexPath(params.nodeId)))) {
		return undefined;
	}
	return await params.storage.getJson({
		path: nodeGenerationIndexPath(params.nodeId),
		schema: NodeGenerationIndex.array(),
	});
}

async function geWebPageContents(
	webpageContent: WebPageContent,
	fileResolver: (fileId: FileId) => Promise<DataContent>,
) {
	return await Promise.all(
		webpageContent.webpages.map(async (webpage) => {
			if (webpage.status !== "fetched") {
				return null;
			}
			const data = await fileResolver(webpage.fileId);
			return {
				type: "file",
				data,
				filename: webpage.title,
				mediaType: "text/markdown",
			} satisfies FilePart;
		}),
	).then((result) => result.filter((data) => data !== null));
}

async function getFileContents(
	fileContent: FileContent,
	fileResolver: (fileId: FileId) => Promise<DataContent>,
): Promise<(FilePart | ImagePart)[]> {
	return await Promise.all(
		fileContent.files.map(async (file) => {
			if (file.status !== "uploaded") {
				return null;
			}
			const data = await fileResolver(file.id);
			switch (fileContent.category) {
				case "pdf":
				case "text":
					return {
						type: "file",
						data,
						filename: file.name,
						mediaType: file.type,
					} satisfies FilePart;
				case "image":
					return {
						type: "image",
						image: data,
						mediaType: file.type,
					} satisfies ImagePart;
				default: {
					const _exhaustiveCheck: never = fileContent.category;
					throw new Error(`Unhandled file category: ${_exhaustiveCheck}`);
				}
			}
		}),
	).then((results) => results.filter((result) => result !== null));
}

// Helper function for generating the files description
function getFilesDescription(
	currentCount: number,
	newFilesCount: number,
): string {
	if (newFilesCount > 1) {
		return `${getOrdinal(currentCount + 1)} ~ ${getOrdinal(currentCount + newFilesCount)} attached files`;
	}
	return `${getOrdinal(currentCount + 1)} attached file`;
}

async function buildGenerationMessageForImageGeneration(
	node: ImageGenerationNode,
	contextNodes: Node[],
	fileResolver: (fileId: FileId) => Promise<DataContent>,
	textGenerationResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>,
	imageGenerationResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<ImagePart[] | undefined>,
	appEntryResolver: AppEntryResolver,
): Promise<ModelMessage[]> {
	const prompt = node.content.prompt;
	if (prompt === undefined) {
		throw new Error("Prompt cannot be empty");
	}
	const llmProvider = node.content.llm.provider;
	let userMessage = prompt;

	if (isJsonContent(prompt)) {
		userMessage = jsonContentToText(JSON.parse(prompt));
	}

	const pattern = /\{\{(nd-[a-zA-Z0-9]+):(otp-[a-zA-Z0-9]+)\}\}/g;
	const sourceKeywords = [...userMessage.matchAll(pattern)].map((match) => ({
		nodeId: NodeId.parse(match[1]),
		outputId: OutputId.parse(match[2]),
	}));

	const attachedFiles: (FilePart | ImagePart)[] = [];
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
			case "textGeneration":
			case "contentGeneration": {
				const result = await textGenerationResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				if (result !== undefined) {
					userMessage = userMessage.replace(replaceKeyword, result);
				}
				break;
			}
			case "file":
				switch (contextNode.content.category) {
					case "text":
					case "image":
					case "pdf": {
						const fileContents = await getFileContents(
							contextNode.content,
							fileResolver,
						);
						userMessage = userMessage.replace(
							replaceKeyword,
							getFilesDescription(attachedFiles.length, fileContents.length),
						);

						attachedFiles.push(...fileContents);
						break;
					}
					default: {
						const _exhaustiveCheck: never = contextNode.content.category;
						throw new Error(`Unhandled category: ${_exhaustiveCheck}`);
					}
				}
				break;

			case "webPage": {
				const fileContents = await geWebPageContents(
					contextNode.content,
					fileResolver,
				);
				switch (llmProvider) {
					case "fal":
					case "openai":
						userMessage = userMessage.replace(
							replaceKeyword,
							fileContents
								.map((fileContent) => {
									if (fileContent.type !== "file") {
										return null;
									}
									if (
										!(
											fileContent.data instanceof Uint8Array ||
											fileContent.data instanceof ArrayBuffer
										)
									) {
										return null;
									}
									const text = new TextDecoder().decode(fileContent.data);
									return `<WebPage name=${fileContent.filename}>${text}</WebPage>`;
								})
								.filter((data): data is string => data !== null)
								.join(),
						);
						break;
					case "google":
						userMessage = userMessage.replace(
							replaceKeyword,
							getFilesDescription(attachedFiles.length, fileContents.length),
						);

						attachedFiles.push(...fileContents);
						break;
					default: {
						const _exhaustiveCheck: never = llmProvider;
						throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
					}
				}
				break;
			}

			case "action":
			case "trigger":
			case "query": {
				const result = await textGenerationResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				// If there is no matching Output, replace it with an empty string (remove the pattern string from userMessage)
				userMessage = userMessage.replace(replaceKeyword, result ?? "");
				break;
			}

			case "appEntry": {
				const result = appEntryResolver(
					sourceKeyword.nodeId,
					sourceKeyword.outputId,
				);

				userMessage = userMessage.replace(
					replaceKeyword,
					result === undefined ? "" : `${result}`,
				);
				break;
			}

			case "imageGeneration": {
				const inputImages = await imageGenerationResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);

				if (inputImages && inputImages.length > 0) {
					userMessage = userMessage.replace(
						replaceKeyword,
						getFilesDescription(attachedFiles.length, inputImages.length),
					);
					attachedFiles.push(...inputImages);
				} else {
					userMessage = userMessage.replace(replaceKeyword, "");
				}
				break;
			}

			case "github":
			case "vectorStore":
			case "end":
				userMessage = userMessage.replace(replaceKeyword, "");
				break;

			default: {
				const _exhaustiveCheck: never = contextNode.content;
				throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
			}
		}
	}
	return [
		{
			role: "user",
			content: [
				{
					type: "text",
					text: userMessage,
				},
				...attachedFiles,
			],
		},
	];
}

function generatedImagePath(generationId: GenerationId, filename: string) {
	return `generations/${generationId}/generated-images/${filename}`;
}

export async function setGeneratedImage(params: {
	storage: GiselleStorage;
	generation: Generation;
	generatedImageFilename: string;
	generatedImage: GeneratedImageData;
}) {
	await params.storage.setBlob(
		generatedImagePath(params.generation.id, params.generatedImageFilename),
		params.generatedImage.uint8Array,
	);
	return;
}

export async function getGeneratedImage(params: {
	storage: GiselleStorage;
	generation: Generation;
	filename: string;
}) {
	return await params.storage.getBlob(
		generatedImagePath(params.generation.id, params.filename),
	);
}

/**
 * Detects if a file is JPEG, PNG, or WebP by examining its header bytes
 * @param imageAsUint8Array The file to check
 * @returns Detected MIME type or null if not recognized
 */
export function detectImageType(
	imageAsUint8Array: Uint8Array<ArrayBufferLike>,
): { contentType: string; ext: string } | null {
	// Get the first 12 bytes of the file (enough for all our formats)
	const bytes = imageAsUint8Array;

	// JPEG: Starts with FF D8 FF
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return { contentType: "image/jpeg", ext: "jpeg" };
	}

	// PNG: Starts with 89 50 4E 47 0D 0A 1A 0A (hex for \x89PNG\r\n\x1a\n)
	if (
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	) {
		return { contentType: "image/png", ext: "png" };
	}

	// WebP: Starts with RIFF....WEBP (52 49 46 46 ... 57 45 42 50)
	if (
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return { contentType: "image/webp", ext: "webp" };
	}

	// Not a recognized image format
	return null;
}

/**
 * Calculates and records the time consumed by the agent
 */
export async function handleAgentTimeConsumption(args: {
	workspaceId: WorkspaceId;
	generation: CompletedGeneration;
	onConsumeAgentTime?: NonNullable<GiselleContext["onConsumeAgentTime"]>;
}) {
	const { workspaceId, generation, onConsumeAgentTime } = args;

	if (onConsumeAgentTime == null) {
		return;
	}
	const totalDurationMs = generation.completedAt - generation.startedAt;
	await onConsumeAgentTime(
		workspaceId,
		generation.startedAt,
		generation.completedAt,
		totalDurationMs,
	);
}

type CheckUsageLimitsResult = { type: "ok" } | { type: "error"; error: string };

/**
 * Check usage limits for the workspace
 */
export async function checkUsageLimits(args: {
	workspaceId: WorkspaceId;
	generation: Generation;
	fetchUsageLimitsFn?: NonNullable<GiselleContext["fetchUsageLimitsFn"]>;
}): Promise<CheckUsageLimitsResult> {
	const { workspaceId, generation, fetchUsageLimitsFn } = args;
	if (fetchUsageLimitsFn == null) {
		return { type: "ok" };
	}
	const usageLimits = await fetchUsageLimitsFn(workspaceId);

	const generationContext = GenerationContext.parse(generation.context);
	const operationNode = generationContext.operationNode;
	if (
		!isTextGenerationNode(operationNode) &&
		!isImageGenerationNode(operationNode)
	) {
		return { type: "ok" };
	}
	const llm = operationNode.content.llm;
	const languageModel = languageModels.find((model) => model.id === llm.id);
	if (languageModel === undefined) {
		return {
			type: "error",
			error: "Language model not found",
		};
	}
	if (!hasTierAccess(languageModel, usageLimits.featureTier)) {
		return {
			type: "error",
			error:
				"Access denied: insufficient tier for the requested language model.",
		};
	}

	const agentTimeLimits = usageLimits.resourceLimits.agentTime;
	if (agentTimeLimits.used >= agentTimeLimits.limit) {
		return {
			type: "error",
			error:
				"Access denied: insufficient agent time for the requested generation.",
		};
	}
	return { type: "ok" };
}

export function queryResultToText(
	queryResult: Extract<GenerationOutput, { type: "query-result" }>,
): string | undefined {
	if (!queryResult.content || queryResult.content.length === 0) {
		return undefined;
	}

	const sections: string[] = [];

	for (const result of queryResult.content) {
		if (result.type === "vector-store") {
			let sourceInfo = "## Vector Store Search Results";
			if (
				result.source.provider === "github" &&
				result.source.state.status === "configured"
			) {
				sourceInfo += ` from ${result.source.state.owner}/${result.source.state.repo}`;
			}
			sections.push(sourceInfo);

			if (result.records.length === 0) {
				sections.push("No matching results found.");
				continue;
			}

			for (let i = 0; i < result.records.length; i++) {
				const record = result.records[i];
				const recordSections = [
					`### Result ${i + 1} (Relevance: ${record.score.toFixed(3)})`,
					record.chunkContent.trim(),
				];

				if (record.metadata && Object.keys(record.metadata).length > 0) {
					const metadataEntries = Object.entries(record.metadata)
						.map(([key, value]) => `${key}: ${value}`)
						.join(", ");
					recordSections.push(`*Source: ${metadataEntries}*`);
				}

				// Include additional data if present
				if (record.additional && Object.keys(record.additional).length > 0) {
					for (const [key, value] of Object.entries(record.additional)) {
						if (typeof value === "string") {
							if (value.includes("\n") || value.includes("#")) {
								recordSections.push(`#### Additional: ${key}\n${value}`);
							} else {
								recordSections.push(`*${key}:* ${value}`);
							}
						} else {
							recordSections.push(
								`*${key}:* ${typeof value === "object" ? JSON.stringify(value) : value}`,
							);
						}
					}
				}

				sections.push(recordSections.join("\n\n"));
			}
		}
	}

	return sections.length > 0 ? sections.join("\n\n---\n\n") : undefined;
}

async function buildGenerationMessageForContentGeneration({
	node,
	contextNodes,
	fileResolver,
	generationContentResolver,
	appEntryResolver,
}: {
	node: ContentGenerationNode;
	contextNodes: Node[];
	fileResolver: (fileId: FileId) => Promise<DataContent>;
	generationContentResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>;
	appEntryResolver: AppEntryResolver;
}): Promise<ModelMessage[]> {
	const llmProvider = node.content.languageModel.provider;
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

	const attachedFiles: (FilePart | ImagePart)[] = [];
	const attachedFileNodeIds: NodeId[] = [];
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
				const jsonOrText = contextNode.content.text;
				const text = isJsonContent(jsonOrText)
					? jsonContentToText(JSON.parse(jsonOrText))
					: jsonOrText;
				userMessage = userMessage.replace(replaceKeyword, text);
				break;
			}
			case "textGeneration":
			case "contentGeneration": {
				const result = await generationContentResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				// If there is no matching Output, replace it with an empty string (remove the pattern string from userMessage)
				userMessage = userMessage.replace(replaceKeyword, result ?? "");
				break;
			}
			case "file":
				if (
					attachedFileNodeIds.some(
						(attachedFileNodeId) => contextNode.id === attachedFileNodeId,
					)
				) {
					continue;
				}
				switch (contextNode.content.category) {
					case "text": {
						const fileContents = await getFileContents(
							contextNode.content,
							fileResolver,
						);
						userMessage = userMessage.replace(
							replaceKeyword,
							fileContents
								.map((fileContent) => {
									if (fileContent.type === "image") {
										return null;
									}
									if (!(fileContent.data instanceof Uint8Array)) {
										return null;
									}
									const text = new TextDecoder().decode(fileContent.data);
									return `<File name=${fileContent.filename}>${text}</File>`;
								})
								.filter((data) => data !== null)
								.join(),
						);

						break;
					}
					case "image":
					case "pdf": {
						const fileContents = await getFileContents(
							contextNode.content,
							fileResolver,
						);
						userMessage = userMessage.replace(
							replaceKeyword,
							getFilesDescription(attachedFiles.length, fileContents.length),
						);

						attachedFiles.push(...fileContents);
						attachedFileNodeIds.push(contextNode.id);
						break;
					}
					default: {
						const _exhaustiveCheck: never = contextNode.content.category;
						throw new Error(`Unhandled category: ${_exhaustiveCheck}`);
					}
				}
				break;

			case "github":
			case "imageGeneration":
			case "vectorStore":
				throw new Error("Not implemented");

			case "webPage": {
				const fileContents = await geWebPageContents(
					contextNode.content,
					fileResolver,
				);
				switch (llmProvider) {
					case "anthropic":
					case "openai":
						userMessage = userMessage.replace(
							replaceKeyword,
							fileContents
								.map((fileContent) => {
									if (fileContent.type !== "file") {
										return null;
									}
									if (
										!(
											fileContent.data instanceof Uint8Array ||
											fileContent.data instanceof ArrayBuffer
										)
									) {
										return null;
									}
									const text = new TextDecoder().decode(fileContent.data);
									return `<WebPage name=${fileContent.filename}>${text}</WebPage>`;
								})
								.filter((data): data is string => data !== null)
								.join(),
						);
						break;
					case "google":
						userMessage = userMessage.replace(
							replaceKeyword,
							getFilesDescription(attachedFiles.length, fileContents.length),
						);

						attachedFiles.push(...fileContents);
						attachedFileNodeIds.push(contextNode.id);
						break;
					default: {
						const _exhaustiveCheck: never = llmProvider;
						throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
					}
				}
				break;
			}

			case "query":
			case "trigger":
			case "action": {
				const result = await generationContentResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				// If there is no matching Output, replace it with an empty string (remove the pattern string from userMessage)
				userMessage = userMessage.replace(replaceKeyword, result ?? "");
				break;
			}
			case "end": {
				userMessage = userMessage.replace(replaceKeyword, "");
				break;
			}
			case "appEntry": {
				const result = appEntryResolver(
					sourceKeyword.nodeId,
					sourceKeyword.outputId,
				);

				userMessage = userMessage.replace(
					replaceKeyword,
					result === undefined ? "" : `${result}`,
				);
				break;
			}
			default: {
				const _exhaustiveCheck: never = contextNode.content;
				throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
			}
		}
	}
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
