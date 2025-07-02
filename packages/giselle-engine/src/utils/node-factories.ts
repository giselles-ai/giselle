import {
	type ActionNode,
	type FileContent,
	type FileData,
	FileId,
	type FileNode,
	type GitHubContent,
	type GitHubNode,
	type ImageGenerationContent,
	type ImageGenerationNode,
	type Input,
	InputId,
	isActionNode,
	isFileNode,
	isGitHubNode,
	isImageGenerationNode,
	isQueryNode,
	isTextGenerationNode,
	isTextNode,
	isTriggerNode,
	isVectorStoreNode,
	isWebPageNode,
	type Node,
	NodeId,
	type OperationNode,
	type Output,
	OutputId,
	type QueryNode,
	type TextGenerationContent,
	type TextGenerationNode,
	type TextNode,
	type TriggerContent,
	type TriggerNode,
	type VariableNode,
	type VectorStoreContent,
	type VectorStoreNode,
	type WebPageNode,
} from "@giselle-sdk/data-type";
import type { ActionProvider } from "@giselle-sdk/flow";
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
import {
	isJsonContent,
	type JSONContent,
} from "@giselle-sdk/text-editor-utils";
import {
	actionNodeDefaultName,
	defaultName,
	triggerNodeDefaultName,
	vectorStoreNodeDefaultName,
} from "./node-default-name";

type ClonedFileDataPayload = FileData & {
	originalFileIdForCopy: FileId;
};

export function isClonedFileDataPayload(
	data: FileData,
): data is ClonedFileDataPayload {
	return "originalFileIdForCopy" in data;
}

type OperationNodeContentType = OperationNode["content"]["type"];
type VariableNodeContentType = VariableNode["content"]["type"];
export type NodeContentType =
	| OperationNodeContentType
	| VariableNodeContentType;

// --- ID Mapping Types and Helpers ---
interface OutputIdMap {
	[oldId: string]: OutputId;
}
interface InputIdMap {
	[oldId: string]: InputId;
}

interface CloneOutputResult {
	newIo: Output[];
	idMap: OutputIdMap;
}

interface CloneInputResult {
	newIo: Input[];
	idMap: InputIdMap;
}

function cloneAndRenewOutputIdsWithMap(
	originalOutputs: ReadonlyArray<Output>,
): CloneOutputResult {
	const newOutputs: Output[] = [];
	const idMap: OutputIdMap = {};
	for (const o of originalOutputs) {
		const newId = OutputId.generate();
		newOutputs.push({ ...o, id: newId });
		idMap[o.id] = newId;
	}
	return { newIo: newOutputs, idMap };
}

function cloneAndRenewInputIdsWithMap(
	originalInputs: ReadonlyArray<Input>,
): CloneInputResult {
	const newInputs: Input[] = [];
	const idMap: InputIdMap = {};
	for (const i of originalInputs) {
		const newId = InputId.generate();
		newInputs.push({ ...i, id: newId });
		idMap[i.id] = newId;
	}
	return { newIo: newInputs, idMap };
}

// --- Node Factory Interface and Result Type ---
export interface NodeFactoryCloneResult<N extends Node> {
	newNode: N;
	inputIdMap: InputIdMap;
	outputIdMap: OutputIdMap;
}

interface NodeFactory<N extends Node, CreateArg = void> {
	create: CreateArg extends void ? () => N : (arg: CreateArg) => N;
	clone(orig: N): NodeFactoryCloneResult<N>;
}

const textGenerationFactoryImpl = {
	create: (llm: TextGenerationContent["llm"]): TextGenerationNode => {
		const outputs: Output[] = [
			{
				id: OutputId.generate(),
				label: "Output",
				accessor: "generated-text",
			},
		];
		const languageModel = languageModels.find(
			(languageModel) => languageModel.id === llm.id,
		);
		if (
			languageModel !== undefined &&
			hasCapability(languageModel, Capability.SearchGrounding)
		) {
			outputs.push({
				id: OutputId.generate(),
				label: "Source",
				accessor: "source",
			});
		}

		return {
			id: NodeId.generate(),
			type: "operation",
			content: {
				type: "textGeneration",
				llm,
			},
			inputs: [],
			outputs,
		} satisfies TextGenerationNode;
	},
	clone: (
		orig: TextGenerationNode,
	): NodeFactoryCloneResult<TextGenerationNode> => {
		const clonedContent = structuredClone(orig.content);
		const { newIo: newInputs, idMap: inputIdMap } =
			cloneAndRenewInputIdsWithMap(orig.inputs);
		const { newIo: newOutputs, idMap: outputIdMap } =
			cloneAndRenewOutputIdsWithMap(orig.outputs);

		if (clonedContent.prompt && isJsonContent(clonedContent.prompt)) {
			try {
				const promptJsonContent: JSONContent =
					typeof clonedContent.prompt === "string"
						? JSON.parse(clonedContent.prompt)
						: clonedContent.prompt;

				function keepSourceRefs(
					content: JSONContent[] | undefined,
				): JSONContent[] | undefined {
					if (!content) return undefined;

					return content
						.map((item) => {
							if (item.content) {
								const newSubContent = keepSourceRefs(item.content);
								if (
									newSubContent &&
									newSubContent.length === 0 &&
									item.type !== "paragraph"
								) {
									return { ...item, content: newSubContent };
								}

								if (!newSubContent && item.content) {
									return null;
								}
							}
							return item;
						})
						.filter(
							(item): item is JSONContent =>
								item !== null &&
								!(item.type === "text" && !item.text?.trim() && !item.marks),
						);
				}

				const processedPromptContent = keepSourceRefs(
					promptJsonContent.content,
				);

				if (processedPromptContent && processedPromptContent.length > 0) {
					promptJsonContent.content = processedPromptContent;
					clonedContent.prompt = JSON.stringify(promptJsonContent);
				} else {
					clonedContent.prompt = "";
				}
			} catch (e) {
				console.error("Error processing prompt for TextGeneration clone:", e);
				clonedContent.prompt = "";
			}
		}

		const newNode = {
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: newInputs,
			outputs: newOutputs,
		} satisfies TextGenerationNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<TextGenerationNode, TextGenerationContent["llm"]>;

const imageGenerationFactoryImpl = {
	create: (llm: ImageGenerationContent["llm"]): ImageGenerationNode =>
		({
			id: NodeId.generate(),
			type: "operation",
			content: {
				type: "imageGeneration",
				llm,
			},
			inputs: [],
			outputs: [
				{
					id: OutputId.generate(),
					label: "Output",
					accessor: "generated-image",
				},
			],
		}) satisfies ImageGenerationNode,
	clone: (
		orig: ImageGenerationNode,
	): NodeFactoryCloneResult<ImageGenerationNode> => {
		const { newIo: newInputs, idMap: inputIdMap } =
			cloneAndRenewInputIdsWithMap(orig.inputs);
		const { newIo: newOutputs, idMap: outputIdMap } =
			cloneAndRenewOutputIdsWithMap(orig.outputs);

		const newNode = {
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: structuredClone(orig.content),
			inputs: newInputs,
			outputs: newOutputs,
		} satisfies ImageGenerationNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<ImageGenerationNode, ImageGenerationContent["llm"]>;

const triggerFactoryImpl = {
	create: (provider: TriggerContent["provider"]): TriggerNode =>
		({
			id: NodeId.generate(),
			type: "operation",
			name: triggerNodeDefaultName(provider),
			content: {
				type: "trigger",
				provider,
				state: {
					status: "unconfigured",
				},
			},
			inputs: [],
			outputs: [],
		}) satisfies TriggerNode,
	clone: (orig: TriggerNode): NodeFactoryCloneResult<TriggerNode> => {
		const clonedContent = structuredClone(orig.content);
		// Reset trigger state to unconfigured - actual configuration duplication
		// is handled at higher level in handleTriggerNodeCopy
		clonedContent.state = { status: "unconfigured" };

		const { newIo: newInputs, idMap: inputIdMap } =
			cloneAndRenewInputIdsWithMap(orig.inputs);
		const { newIo: newOutputs, idMap: outputIdMap } =
			cloneAndRenewOutputIdsWithMap(orig.outputs);

		const newNode = {
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: newInputs,
			outputs: newOutputs,
		} satisfies TriggerNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<TriggerNode, TriggerContent["provider"]>;

const actionFactoryImpl = {
	create: (provider: ActionProvider): ActionNode =>
		({
			id: NodeId.generate(),
			type: "operation",
			name: actionNodeDefaultName(provider),
			content: {
				type: "action",
				command: {
					provider,
					state: {
						status: "unconfigured",
					},
				},
			},
			inputs: [],
			outputs: [],
		}) satisfies ActionNode,
	clone: (orig: ActionNode): NodeFactoryCloneResult<ActionNode> => {
		const clonedContent = structuredClone(orig.content);
		// Reset action state to unconfigured - actual configuration duplication
		// is handled at higher level in handleActionNodeCopy
		clonedContent.command.state = { status: "unconfigured" };

		const { newIo: newInputs, idMap: inputIdMap } =
			cloneAndRenewInputIdsWithMap(orig.inputs);
		const { newIo: newOutputs, idMap: outputIdMap } =
			cloneAndRenewOutputIdsWithMap(orig.outputs);

		const newNode = {
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: newInputs,
			outputs: newOutputs,
		} satisfies ActionNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<ActionNode, ActionProvider>;

const queryFactoryImpl = {
	create: (): QueryNode => {
		return {
			id: NodeId.generate(),
			type: "operation",
			content: {
				type: "query",
				query: "",
			},
			inputs: [],
			outputs: [
				{
					id: OutputId.generate(),
					label: "Result",
					accessor: "result",
				},
			],
		} satisfies QueryNode;
	},
	clone: (orig: QueryNode): NodeFactoryCloneResult<QueryNode> => {
		const { newIo: newInputs, idMap: inputIdMap } =
			cloneAndRenewInputIdsWithMap(orig.inputs);
		const { newIo: newOutputs, idMap: outputIdMap } =
			cloneAndRenewOutputIdsWithMap(orig.outputs);

		const newNode = {
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: structuredClone(orig.content),
			inputs: newInputs,
			outputs: newOutputs,
		} satisfies QueryNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<QueryNode>;

const textVariableFactoryImpl = {
	create: (): TextNode =>
		({
			id: NodeId.generate(),
			type: "variable",
			content: {
				type: "text",
				text: "",
			},
			inputs: [],
			outputs: [
				{
					id: OutputId.generate(),
					label: "Output",
					accessor: "text",
				},
			],
		}) satisfies TextNode,
	clone: (orig: TextNode): NodeFactoryCloneResult<TextNode> => {
		const { newIo: newInputs, idMap: inputIdMap } =
			cloneAndRenewInputIdsWithMap(orig.inputs);
		const { newIo: newOutputs, idMap: outputIdMap } =
			cloneAndRenewOutputIdsWithMap(orig.outputs);

		const newNode = {
			id: NodeId.generate(),
			type: "variable",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: structuredClone(orig.content),
			inputs: newInputs,
			outputs: newOutputs,
		} satisfies TextNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<TextNode>;

const fileVariableFactoryImpl = {
	create: (category: FileContent["category"]): FileNode =>
		({
			id: NodeId.generate(),
			type: "variable",
			content: {
				type: "file",
				category,
				files: [],
			},
			inputs: [],
			outputs: [
				{
					id: OutputId.generate(),
					label: "Output",
					accessor: "text",
				},
			],
		}) satisfies FileNode,
	clone: (orig: FileNode): NodeFactoryCloneResult<FileNode> => {
		const clonedContent = structuredClone(orig.content);
		clonedContent.files = orig.content.files.map(
			(fileData: FileData): ClonedFileDataPayload => {
				const newFileId = FileId.generate();
				return {
					...fileData,
					id: newFileId,
					originalFileIdForCopy: fileData.id,
				};
			},
		);

		const { newIo: newInputs, idMap: inputIdMap } =
			cloneAndRenewInputIdsWithMap(orig.inputs);
		const { newIo: newOutputs, idMap: outputIdMap } =
			cloneAndRenewOutputIdsWithMap(orig.outputs);

		const newNode = {
			id: NodeId.generate(),
			type: "variable",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: newInputs,
			outputs: newOutputs,
		} satisfies FileNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<FileNode, FileContent["category"]>;

const githubVariableFactoryImpl = {
	create: (
		objectReferences: GitHubContent["objectReferences"] = [],
	): GitHubNode =>
		({
			id: NodeId.generate(),
			type: "variable",
			content: { type: "github", objectReferences },
			inputs: [],
			outputs: [{ id: OutputId.generate(), label: "Output", accessor: "text" }],
		}) satisfies GitHubNode,
	clone: (orig: GitHubNode): NodeFactoryCloneResult<GitHubNode> => {
		const { newIo: newInputs, idMap: inputIdMap } =
			cloneAndRenewInputIdsWithMap(orig.inputs);
		const { newIo: newOutputs, idMap: outputIdMap } =
			cloneAndRenewOutputIdsWithMap(orig.outputs);

		const newNode = {
			id: NodeId.generate(),
			type: "variable",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: structuredClone(orig.content),
			inputs: newInputs,
			outputs: newOutputs,
		} satisfies GitHubNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<GitHubNode, GitHubContent["objectReferences"]>;

const vectorStoreFactoryImpl = {
	create: (
		provider: VectorStoreContent["source"]["provider"],
	): VectorStoreNode => ({
		id: NodeId.generate(),
		type: "variable",
		name: vectorStoreNodeDefaultName(provider),
		content: {
			type: "vectorStore",
			source: {
				provider: provider,
				state: {
					status: "unconfigured",
				},
			},
		},
		inputs: [],
		outputs: [
			{
				id: OutputId.generate(),
				label: "Output",
				accessor: "source",
			},
		],
	}),
	clone: (orig: VectorStoreNode): NodeFactoryCloneResult<VectorStoreNode> => {
		const clonedContent = structuredClone(orig.content);
		// Reset vector store state to unconfigured - actual configuration duplication
		// is handled at higher level in handleVectorStoreNodeCopy
		clonedContent.source.state = { status: "unconfigured" };

		const { newIo: newInputs, idMap: inputIdMap } =
			cloneAndRenewInputIdsWithMap(orig.inputs);
		const { newIo: newOutputs, idMap: outputIdMap } =
			cloneAndRenewOutputIdsWithMap(orig.outputs);

		const newNode = {
			id: NodeId.generate(),
			type: "variable",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: newInputs,
			outputs: newOutputs,
		} satisfies VectorStoreNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<
	VectorStoreNode,
	VectorStoreContent["source"]["provider"]
>;

const webPageFactoryImpl = {
	create: (): WebPageNode => ({
		id: NodeId.generate(),
		type: "variable",
		content: {
			type: "webPage",
			webpages: [],
		},
		inputs: [],
		outputs: [
			{
				id: OutputId.generate(),
				label: "Output",
				accessor: "web-page",
			},
		],
	}),
	clone: (orig: WebPageNode): NodeFactoryCloneResult<WebPageNode> => {
		const { newIo: newInputs, idMap: inputIdMap } =
			cloneAndRenewInputIdsWithMap(orig.inputs);
		const { newIo: newOutputs, idMap: outputIdMap } =
			cloneAndRenewOutputIdsWithMap(orig.outputs);

		const newNode = {
			id: NodeId.generate(),
			type: "variable",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: structuredClone(orig.content),
			inputs: newInputs,
			outputs: newOutputs,
		} satisfies WebPageNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<WebPageNode>;

// --- Factories Manager ---
const factoryImplementations = {
	textGeneration: textGenerationFactoryImpl,
	imageGeneration: imageGenerationFactoryImpl,
	trigger: triggerFactoryImpl,
	action: actionFactoryImpl,
	query: queryFactoryImpl,
	text: textVariableFactoryImpl,
	file: fileVariableFactoryImpl,
	github: githubVariableFactoryImpl,
	vectorStore: vectorStoreFactoryImpl,
	webPage: webPageFactoryImpl,
} as const;

type CreateArgMap = {
	textGeneration: Parameters<typeof textGenerationFactoryImpl.create>[0];
	imageGeneration: Parameters<typeof imageGenerationFactoryImpl.create>[0];
	trigger: Parameters<typeof triggerFactoryImpl.create>[0];
	action: Parameters<typeof actionFactoryImpl.create>[0];
	query: undefined; // queryFactoryImpl.create is no argument
	text: undefined; // textVariableFactoryImpl.create is no argument
	file: Parameters<typeof fileVariableFactoryImpl.create>[0];
	github: Parameters<typeof githubVariableFactoryImpl.create>[0];
	vectorStore: Parameters<typeof vectorStoreFactoryImpl.create>[0];
	webPage: undefined;
};

const nodeTypesRequiringArg = (
	Object.keys(factoryImplementations) as Array<
		keyof typeof factoryImplementations
	>
).filter(
	(type) => factoryImplementations[type].create.length > 0,
) as NodeContentType[];

export function createTextGenerationNode(
	llm: TextGenerationContent["llm"],
): TextGenerationNode {
	return textGenerationFactoryImpl.create(llm);
}

export function createImageGenerationNode(
	llm: ImageGenerationContent["llm"],
): ImageGenerationNode {
	return imageGenerationFactoryImpl.create(llm);
}

export function createTriggerNode(
	provider: TriggerContent["provider"],
): TriggerNode {
	return triggerFactoryImpl.create(provider);
}

export function createActionNode(provider: ActionProvider): ActionNode {
	return actionFactoryImpl.create(provider);
}

export function createQueryNode(): QueryNode {
	return queryFactoryImpl.create();
}

export function createTextNode(): TextNode {
	return textVariableFactoryImpl.create();
}

export function createFileNode(category: FileContent["category"]): FileNode {
	return fileVariableFactoryImpl.create(category);
}

export function createGitHubNode(
	objectReferences: GitHubContent["objectReferences"] = [],
): GitHubNode {
	return githubVariableFactoryImpl.create(objectReferences);
}

export function createVectorStoreNode(
	provider: VectorStoreContent["source"]["provider"],
): VectorStoreNode {
	return vectorStoreFactoryImpl.create(provider);
}

export function createWebPageNode(): WebPageNode {
	return webPageFactoryImpl.create();
}

export function cloneNode<N extends Node>(
	sourceNode: N,
): NodeFactoryCloneResult<N> {
	const contentType = sourceNode.content.type;
	switch (contentType) {
		case "textGeneration":
			if (isTextGenerationNode(sourceNode)) {
				return textGenerationFactoryImpl.clone(
					sourceNode,
				) as NodeFactoryCloneResult<N>;
			}
			break;
		case "imageGeneration":
			if (isImageGenerationNode(sourceNode)) {
				return imageGenerationFactoryImpl.clone(
					sourceNode,
				) as NodeFactoryCloneResult<N>;
			}
			break;
		case "trigger":
			if (isTriggerNode(sourceNode)) {
				return triggerFactoryImpl.clone(
					sourceNode,
				) as NodeFactoryCloneResult<N>;
			}
			break;
		case "action":
			if (isActionNode(sourceNode)) {
				return actionFactoryImpl.clone(sourceNode) as NodeFactoryCloneResult<N>;
			}
			break;
		case "query":
			if (isQueryNode(sourceNode)) {
				return queryFactoryImpl.clone(sourceNode) as NodeFactoryCloneResult<N>;
			}
			break;
		case "text":
			if (isTextNode(sourceNode)) {
				return textVariableFactoryImpl.clone(
					sourceNode,
				) as NodeFactoryCloneResult<N>;
			}
			break;
		case "file":
			if (isFileNode(sourceNode)) {
				return fileVariableFactoryImpl.clone(
					sourceNode,
				) as NodeFactoryCloneResult<N>;
			}
			break;
		case "github":
			if (isGitHubNode(sourceNode)) {
				return githubVariableFactoryImpl.clone(
					sourceNode,
				) as NodeFactoryCloneResult<N>;
			}
			break;
		case "vectorStore":
			if (isVectorStoreNode(sourceNode)) {
				return vectorStoreFactoryImpl.clone(
					sourceNode,
				) as NodeFactoryCloneResult<N>;
			}
			break;
		case "webPage":
			if (isWebPageNode(sourceNode)) {
				return webPageFactoryImpl.clone(
					sourceNode,
				) as NodeFactoryCloneResult<N>;
			}
			break;
		default: {
			const _exhaustive: never = contentType;
			throw new Error(`No clone factory for content type: ${_exhaustive}`);
		}
	}

	throw new Error(`Invalid node structure for content type: ${contentType}`);
}

export const nodeFactories = {
	create: <K extends NodeContentType>(type: K, arg?: CreateArgMap[K]) => {
		if (nodeTypesRequiringArg.includes(type) && arg === undefined) {
			throw new Error(`Argument required for node type: ${type}`);
		}

		switch (type) {
			case "textGeneration":
				return factoryImplementations.textGeneration.create(
					arg as CreateArgMap["textGeneration"],
				);
			case "imageGeneration":
				return factoryImplementations.imageGeneration.create(
					arg as CreateArgMap["imageGeneration"],
				);
			case "trigger":
				return factoryImplementations.trigger.create(
					arg as CreateArgMap["trigger"],
				);
			case "action":
				return factoryImplementations.action.create(
					arg as CreateArgMap["action"],
				);
			case "query":
				return factoryImplementations.query.create();
			case "text":
				return factoryImplementations.text.create();
			case "file":
				return factoryImplementations.file.create(arg as CreateArgMap["file"]);
			case "github":
				return factoryImplementations.github.create(
					arg as CreateArgMap["github"],
				);
			case "vectorStore":
				return factoryImplementations.vectorStore.create(
					arg as CreateArgMap["vectorStore"],
				);
			case "webPage":
				return factoryImplementations.webPage.create();
			default: {
				const _exhaustive: never = type;
				throw new Error(`No create factory for content type: ${_exhaustive}`);
			}
		}
	},
	clone: (sourceNode: Node) => {
		const contentType = sourceNode.content.type;
		switch (contentType) {
			case "textGeneration":
				if (isTextGenerationNode(sourceNode)) {
					return factoryImplementations.textGeneration.clone(sourceNode);
				}
				break;
			case "imageGeneration":
				if (isImageGenerationNode(sourceNode)) {
					return factoryImplementations.imageGeneration.clone(sourceNode);
				}
				break;
			case "trigger":
				if (isTriggerNode(sourceNode)) {
					return factoryImplementations.trigger.clone(sourceNode);
				}
				break;
			case "action":
				if (isActionNode(sourceNode)) {
					return factoryImplementations.action.clone(sourceNode);
				}
				break;
			case "query":
				if (isQueryNode(sourceNode)) {
					return factoryImplementations.query.clone(sourceNode);
				}
				break;
			case "text":
				if (isTextNode(sourceNode)) {
					return factoryImplementations.text.clone(sourceNode);
				}
				break;
			case "file":
				if (isFileNode(sourceNode)) {
					return factoryImplementations.file.clone(sourceNode);
				}
				break;
			case "github":
				if (isGitHubNode(sourceNode)) {
					return factoryImplementations.github.clone(sourceNode);
				}
				break;
			case "vectorStore":
				if (isVectorStoreNode(sourceNode)) {
					return factoryImplementations.vectorStore.clone(sourceNode);
				}
				break;
			case "webPage":
				if (isWebPageNode(sourceNode)) {
					return factoryImplementations.webPage.clone(sourceNode);
				}
				break;
			default: {
				const _exhaustive: never = contentType;
				throw new Error(`No clone factory for content type: ${_exhaustive}`);
			}
		}

		throw new Error(`Invalid node structure for content type: ${contentType}`);
	},
};
