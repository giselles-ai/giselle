import {
	type ActionNode,
	type CompletedGeneration,
	type FileContent,
	type FileData,
	Generation,
	type GenerationId,
	GenerationIndex,
	type GenerationOrigin,
	type Node,
	NodeGenerationIndex,
	NodeId,
	OutputId,
	type RunId,
	type TextGenerationNode,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import { isJsonContent, jsonContentToText } from "@giselle-sdk/text-editor";
import type { CoreMessage, DataContent, FilePart, ImagePart } from "ai";
import type { Storage } from "unstorage";
import { getRun } from "../runs/utils";
import type { GiselleEngineContext } from "../types";

export interface FileIndex {
	nodeId: NodeId;
	start: number;
	end: number;
}

export async function buildMessageObject(
	node: ActionNode,
	contextNodes: Node[],
	fileResolver: (file: FileData) => Promise<DataContent>,
	textGenerationResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>,
): Promise<CoreMessage[]> {
	switch (node.content.type) {
		case "textGeneration": {
			return await buildGenerationMessageForTextGeneration(
				node,
				contextNodes,
				fileResolver,
				textGenerationResolver,
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
	textGenerationResolver: (
		nodeId: NodeId,
		outputId: OutputId,
	) => Promise<string | undefined>,
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
			case "file": {
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
		case "perplexity": {
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

function generationIndexPath(generationId: GenerationId) {
	return `generations/${generationId}.json`;
}
export async function getGenerationIndex(params: {
	storage: Storage;
	generationId: GenerationId;
}) {
	const unsafeGenerationIndex = await params.storage.getItem(
		generationIndexPath(params.generationId),
	);
	if (unsafeGenerationIndex === null) {
		return undefined;
	}
	return GenerationIndex.parse(unsafeGenerationIndex);
}
export async function setGenerationIndex(params: {
	storage: Storage;
	generationIndex: GenerationIndex;
}) {
	await params.storage.setItem(
		generationIndexPath(params.generationIndex.id),
		GenerationIndex.parse(params.generationIndex),
		{
			// Disable caching by setting cacheControlMaxAge to 0 for Vercel Blob storage
			cacheControlMaxAge: 0,
		},
	);
}
export function generationPath(generationIndex: GenerationIndex) {
	const generationOrigin = generationIndex.origin;
	const originType = generationOrigin.type;
	switch (originType) {
		case "workspace":
			return `workspaces/${generationOrigin.id}/generations/${generationIndex.id}/generation.json`;
		case "run":
			return `runs/${generationOrigin.id}/generations/${generationIndex.id}/generation.json`;
		default: {
			const _exhaustiveCheck: never = originType;
			return _exhaustiveCheck;
		}
	}
}

export function activeNodeGenerationIdPath(
	params: {
		storage: Storage;
		nodeId: NodeId;
	} & { origin: GenerationOrigin },
) {
	switch (params.origin.type) {
		case "workspace":
			return `workspaces/${params.origin.id}/node-generations/${params.nodeId}/activeGenerationId.txt`;
		case "run":
			return `runs/${params.origin.id}/node-generations/${params.nodeId}/activeGenerationId.txt`;
		default: {
			const _exhaustiveCheck: never = params.origin;
			return _exhaustiveCheck;
		}
	}
}

export async function setGeneration(params: {
	storage: Storage;
	generation: Generation;
}) {
	await params.storage.setItem(
		generationPath({
			id: params.generation.id,
			origin: params.generation.context.origin,
		}),
		Generation.parse(params.generation),
		{
			// Disable caching by setting cacheControlMaxAge to 0 for Vercel Blob storage
			cacheControlMaxAge: 0,
		},
	);
}

export async function getGeneration(params: {
	storage: Storage;
	generationId: GenerationId;
}): Promise<Generation | undefined> {
	const generationIndex = await getGenerationIndex({
		storage: params.storage,
		generationId: params.generationId,
	});
	if (generationIndex == null) {
		throw new Error("Generation not found");
	}
	const unsafeGeneration = await params.storage.getItem(
		generationPath(generationIndex),
	);
	return Generation.parse(unsafeGeneration);
}

export function nodeGenerationIndexPath(
	params: {
		storage: Storage;
		nodeId: NodeId;
	} & { origin: GenerationOrigin },
) {
	switch (params.origin.type) {
		case "workspace":
			return `workspaces/${params.origin.id}/node-generations/${params.nodeId}.json`;
		case "run":
			return `runs/${params.origin.id}/node-generations/${params.nodeId}.json`;
		default: {
			const _exhaustiveCheck: never = params.origin;
			return _exhaustiveCheck;
		}
	}
}
export async function setNodeGenerationIndex(
	params: {
		storage: Storage;
		nodeId: NodeId;
		nodeGenerationIndex: NodeGenerationIndex;
	} & { origin: GenerationOrigin },
) {
	let newNodeGenerationIndexes: NodeGenerationIndex[] | undefined;
	const nodeGenerationIndexes = await getNodeGenerationIndexes({
		storage: params.storage,
		nodeId: params.nodeId,
		origin: params.origin,
	});
	if (nodeGenerationIndexes === undefined) {
		newNodeGenerationIndexes = [params.nodeGenerationIndex];
	} else {
		const index = nodeGenerationIndexes.findIndex(
			(nodeGenerationIndex) =>
				nodeGenerationIndex.id === params.nodeGenerationIndex.id,
		);
		if (index === -1) {
			newNodeGenerationIndexes = [
				...nodeGenerationIndexes,
				params.nodeGenerationIndex,
			];
		} else {
			newNodeGenerationIndexes = [
				...nodeGenerationIndexes.slice(0, index),
				params.nodeGenerationIndex,
				...nodeGenerationIndexes.slice(index + 1),
			];
		}
	}
	await params.storage.setItem(
		nodeGenerationIndexPath(params),
		newNodeGenerationIndexes,
		{
			// Disable caching by setting cacheControlMaxAge to 0 for Vercel Blob storage
			cacheControlMaxAge: 0,
		},
	);
}

export async function getNodeGenerationIndexes(
	params: {
		storage: Storage;
		nodeId: NodeId;
	} & { origin: GenerationOrigin },
) {
	const unsafeNodeGenerationIndexData = await params.storage.getItem(
		nodeGenerationIndexPath(params),
	);
	if (unsafeNodeGenerationIndexData === null) {
		return undefined;
	}
	return NodeGenerationIndex.array().parse(unsafeNodeGenerationIndexData);
}

async function getFileContents(
	fileContent: FileContent,
	fileResolver: (file: FileData) => Promise<DataContent>,
): Promise<(FilePart | ImagePart)[]> {
	return await Promise.all(
		fileContent.files.map(async (file) => {
			if (file.status !== "uploaded") {
				return null;
			}
			const data = await fileResolver(file);
			switch (fileContent.category) {
				case "pdf":
				case "text":
					return {
						type: "file",
						data,
						mimeType: file.type,
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

export async function getRedirectedUrlAndTitle(url: string) {
	// Make the request with fetch and set redirect to 'follow'
	const response = await fetch(url, {
		redirect: "follow", // This automatically follows redirects
	});

	// Get the final URL after redirects
	const finalUrl = response.url;

	// Get the HTML content
	const html = await response.text();

	// Extract title using a simple regex pattern
	const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
	const title = titleMatch ? titleMatch[1].trim() : "No title found";

	return {
		originalUrl: url,
		redirectedUrl: finalUrl,
		title: title,
	};
}

/**
 * Calculates and records the time consumed by the agent
 */
export async function handleAgentTimeConsumption(args: {
	storage: GiselleEngineContext["storage"];
	generation: CompletedGeneration;
	origin: { type: "workspace"; id: WorkspaceId } | { type: "run"; id: RunId };
	onConsumeAgentTime: NonNullable<GiselleEngineContext["onConsumeAgentTime"]>;
}) {
	const workspaceId = await extractWorkspaceIdFromOrigin({
		storage: args.storage,
		origin: args.origin,
	});

	const totalDurationMs =
		args.generation.completedAt - args.generation.startedAt;
	await args.onConsumeAgentTime(
		workspaceId,
		args.generation.startedAt,
		args.generation.completedAt,
		totalDurationMs,
	);
}

/**
 * Check usage limits for the workspace
 */
export async function fetchUsageLimits(args: {
	storage: GiselleEngineContext["storage"];
	origin: { type: "workspace"; id: WorkspaceId } | { type: "run"; id: RunId };
	fetchUsageLimitsFn: NonNullable<GiselleEngineContext["fetchUsageLimitsFn"]>;
}) {
	const workspaceId = await extractWorkspaceIdFromOrigin({
		storage: args.storage,
		origin: args.origin,
	});

	return await args.fetchUsageLimitsFn(workspaceId);
}

async function extractWorkspaceIdFromOrigin(args: {
	storage: GiselleEngineContext["storage"];
	origin: { type: "workspace"; id: WorkspaceId } | { type: "run"; id: RunId };
}) {
	if (args.origin.type === "workspace") {
		return args.origin.id;
	}

	const run = await getRun({
		storage: args.storage,
		runId: args.origin.id,
	});

	if (run == null || !("workspaceId" in run)) {
		throw new Error("Run not completed");
	}
	return run.workspaceId;
}
