import {
	type FileContent,
	type FileId,
	type ImageGenerationNode,
	isImageGenerationNode,
	isTextGenerationNode,
	type Node,
	NodeId,
	type OperationNode,
	OutputId,
	type TextGenerationNode,
	type WebPageContent,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import { hasTierAccess, languageModels } from "@giselle-sdk/language-model";
import {
	isJsonContent,
	jsonContentToText,
} from "@giselle-sdk/text-editor-utils";
import type { ModelMessage, DataContent, FilePart, ImagePart } from "ai";
import type { Storage } from "unstorage";
import {
	type CompletedGeneration,
	Generation,
	GenerationContext,
	type GenerationOutput,
	NodeGenerationIndex,
} from "../../concepts/generation";
import type { GenerationId } from "../../concepts/identifiers";
import { parseAndMod } from "../../data-mod";
import type { GiselleStorage } from "../experimental_storage";
import type { GiselleEngineContext } from "../types";

interface GeneratedImageData {
	uint8Array: Uint8Array;
	base64: string;
}

export async function buildMessageObject(
	node: OperationNode,
	contextNodes: Node[],
	fileResolver: (fileId: FileId) => Promise<DataContent>,
	textGenerationResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>,
): Promise<ModelMessage[]> {
	switch (node.content.type) {
		case "textGeneration": {
			return await buildGenerationMessageForTextGeneration(
				node as TextGenerationNode,
				contextNodes,
				fileResolver,
				textGenerationResolver,
			);
		}
		case "imageGeneration": {
			return await buildGenerationMessageForImageGeneration(
				node as ImageGenerationNode,
				contextNodes,
				fileResolver,
				textGenerationResolver,
			);
		}
		case "action":
		case "trigger":
		case "query": {
			return [];
		}
		default: {
			const _exhaustiveCheck: never = node.content;
			throw new Error(`Unhandled content type: ${_exhaustiveCheck}`);
		}
	}
}

async function buildGenerationMessageForTextGeneration(
	node: TextGenerationNode,
	contextNodes: Node[],
	fileResolver: (fileId: FileId) => Promise<DataContent>,
	textGenerationResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>,
): Promise<ModelMessage[]> {
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
			case "textGeneration": {
				const result = await textGenerationResolver(
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
				const result = await textGenerationResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				// If there is no matching Output, replace it with an empty string (remove the pattern string from userMessage)
				userMessage = userMessage.replace(replaceKeyword, result ?? "");
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
	storage: Storage;
	experimental_storage: GiselleStorage;
	useExperimentalStorage?: boolean;
	generationId: GenerationId;
	options?: {
		bypassingCache?: boolean;
		skipMod?: boolean;
	};
}): Promise<Generation | undefined> {
	if (params.useExperimentalStorage) {
		const generation = await params.experimental_storage.getJson({
			path: generationPath(params.generationId),
			schema: Generation,
		});
		const parsedGenerationContext = GenerationContext.parse(generation.context);
		return {
			...generation,
			context: parsedGenerationContext,
		};
	}
	const unsafeGeneration = await params.storage.getItem(
		`${generationPath(params.generationId)}`,
		{
			bypassingCache: params.options?.bypassingCache ?? false,
		},
	);
	if (unsafeGeneration == null) {
		throw new Error(`Generation(id: ${params.generationId}) is not found`);
	}
	if (params.options?.skipMod) {
		const parsedGeneration = Generation.parse(unsafeGeneration);
		const parsedGenerationContext = GenerationContext.parse(
			parsedGeneration.context,
		);
		return {
			...parsedGeneration,
			context: parsedGenerationContext,
		};
	}
	const parsedGeneration = parseAndMod(Generation, unsafeGeneration);
	const parsedGenerationContext = parseAndMod(
		GenerationContext,
		parsedGeneration.context,
	);
	return {
		...parsedGeneration,
		context: parsedGenerationContext,
	};
}

export function nodeGenerationIndexPath(nodeId: NodeId) {
	return `generations/byNode/${nodeId}.json`;
}

export async function getNodeGenerationIndexes(params: {
	storage: Storage;
	experimental_storage: GiselleStorage;
	useExperimentalStorage?: boolean;
	nodeId: NodeId;
}) {
	if (params.useExperimentalStorage) {
		if (
			!(await params.experimental_storage.exists(
				nodeGenerationIndexPath(params.nodeId),
			))
		) {
			return undefined;
		}
		return await params.experimental_storage.getJson({
			path: nodeGenerationIndexPath(params.nodeId),
			schema: NodeGenerationIndex.array(),
		});
	}
	const unsafeNodeGenerationIndexData = await params.storage.getItem(
		nodeGenerationIndexPath(params.nodeId),
		{
			bypassingCache: true,
		},
	);
	if (unsafeNodeGenerationIndexData === null) {
		return undefined;
	}
	return NodeGenerationIndex.array().parse(unsafeNodeGenerationIndexData);
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

                file: {
                    data,
                    filename: webpage.title,
                    mimeType: "text/markdown"
                }
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

                        file: {
                            data,
                            filename: file.name,
                            mimeType: file.type
                        }
                    } satisfies FilePart;
				case "image":
					return {
						type: "image",
						image: data,
						mimeType: file.type,
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
): Promise<ModelMessage[]> {
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
			case "textGeneration": {
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

				userMessage = userMessage.replace(
					replaceKeyword,
					getFilesDescription(attachedFiles.length, fileContents.length),
				);

				attachedFiles.push(...fileContents);
				break;
			}

			case "query": {
				const result = await textGenerationResolver(
					contextNode.id,
					sourceKeyword.outputId,
				);
				// If there is no matching Output, replace it with an empty string (remove the pattern string from userMessage)
				userMessage = userMessage.replace(replaceKeyword, result ?? "");
				break;
			}

			case "github":
			case "imageGeneration":
			case "trigger":
			case "action":
			case "vectorStore":
				throw new Error("Not implemented");

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
			],
		},
	];
}

function generatedImagePath(generationId: GenerationId, filename: string) {
	return `generations/${generationId}/generated-images/${filename}`;
}

export async function setGeneratedImage(params: {
	storage: Storage;
	experimental_storage: GiselleStorage;
	useExperimentalStorage?: boolean;
	generation: Generation;
	generatedImageFilename: string;
	generatedImage: GeneratedImageData;
}) {
	if (params.useExperimentalStorage) {
		await params.experimental_storage.setBlob(
			generatedImagePath(params.generation.id, params.generatedImageFilename),
			params.generatedImage.uint8Array,
		);
		return;
	}
	await params.storage.setItemRaw(
		generatedImagePath(params.generation.id, params.generatedImageFilename),
		params.generatedImage.uint8Array,
	);
}

export async function getGeneratedImage(params: {
	storage: Storage;
	experimental_storage: GiselleStorage;
	useExperimentalStorage?: boolean;
	generation: Generation;
	filename: string;
}) {
	if (params.useExperimentalStorage) {
		return await params.experimental_storage.getBlob(
			generatedImagePath(params.generation.id, params.filename),
		);
	}
	let image = await params.storage.getItemRaw(
		generatedImagePath(params.generation.id, params.filename),
	);
	if (image instanceof ArrayBuffer) {
		image = new Uint8Array(image);
	}

	assertUint8Array(image);
	return image;
}

function assertUint8Array(value: unknown): asserts value is Uint8Array {
	if (!(value instanceof Uint8Array)) {
		throw new TypeError(`Expected Uint8Array but got ${typeof value}`);
	}
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
	onConsumeAgentTime?: NonNullable<GiselleEngineContext["onConsumeAgentTime"]>;
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
	fetchUsageLimitsFn?: NonNullable<GiselleEngineContext["fetchUsageLimitsFn"]>;
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

				sections.push(recordSections.join("\n\n"));
			}
		}
	}

	return sections.length > 0 ? sections.join("\n\n---\n\n") : undefined;
}
