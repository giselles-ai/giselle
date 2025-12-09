import type { ActionProvider } from "@giselles-ai/action-registry";
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselles-ai/language-model";
import { getEntry } from "@giselles-ai/language-model-registry";
import {
	type ActionNode,
	type AppEntryNode,
	AppParameterId,
	type ContentGenerationNode,
	createPendingCopyFileData,
	DEFAULT_MAX_RESULTS,
	DEFAULT_SIMILARITY_THRESHOLD,
	type DraftApp,
	type EndNode,
	type FileContent,
	type FileData,
	type FileId,
	type FileNode,
	type GitHubContent,
	type GitHubNode,
	type ImageGenerationContent,
	type ImageGenerationNode,
	type Input,
	InputId,
	isActionNode,
	isAppEntryNode,
	isContentGenerationNode,
	isEndNode,
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
} from "@giselles-ai/protocol";
import {
	isJsonContent,
	type JSONContent,
} from "@giselles-ai/text-editor-utils";
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
	return (
		"originalFileIdForCopy" in data && data.originalFileIdForCopy !== undefined
	);
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

function createDefaultDraftApp(): DraftApp {
	return {
		name: "App Request",
		description: "",
		iconName: "workflow",
		parameters: [
			{
				id: AppParameterId.generate(),
				name: "Input(Text)",
				type: "multiline-text",
				required: true,
			},
			{
				id: AppParameterId.generate(),
				name: "Input(File)",
				type: "files",
				required: false,
			},
		],
	};
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
				maxResults: DEFAULT_MAX_RESULTS,
				similarityThreshold: DEFAULT_SIMILARITY_THRESHOLD,
			},
			inputs: [],
			outputs: [
				{
					id: OutputId.generate(),
					label: "Output",
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

const endFactoryImpl = {
	create: (): EndNode => ({
		id: NodeId.generate(),
		type: "operation",
		content: {
			type: "end",
		},
		inputs: [],
		outputs: [],
	}),
	clone: (orig: EndNode): NodeFactoryCloneResult<EndNode> => {
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
		} satisfies EndNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<EndNode>;

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
		clonedContent.files = orig.content.files.map((fileData) => {
			// Handle transitive cloning: if already cloned, preserve the original file ID
			const actualOriginalFileId = isClonedFileDataPayload(fileData)
				? fileData.originalFileIdForCopy
				: fileData.id;
			return createPendingCopyFileData({
				name: fileData.name,
				type: fileData.type,
				size: fileData.size,
				originalFileIdForCopy: actualOriginalFileId,
			});
		});

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

const appEntryFactoryImpl = {
	create: (): AppEntryNode => {
		const draftApp = createDefaultDraftApp();
		return {
			id: NodeId.generate(),
			type: "operation",
			content: {
				type: "appEntry",
				status: "unconfigured",
				draftApp,
			},
			inputs: [],
			outputs: draftApp.parameters.map((parameter) => ({
				id: OutputId.generate(),
				label: parameter.name,
				accessor: parameter.id,
			})),
		} satisfies AppEntryNode;
	},
	clone: (orig: AppEntryNode): NodeFactoryCloneResult<AppEntryNode> => {
		const { newIo: newInputs, idMap: inputIdMap } =
			cloneAndRenewInputIdsWithMap(orig.inputs);
		const { newIo: newOutputs, idMap: outputIdMap } =
			cloneAndRenewOutputIdsWithMap(orig.outputs);
		const clonedContent = structuredClone(orig.content);
		const nextContent: AppEntryNode["content"] =
			clonedContent.status === "configured"
				? {
						type: "appEntry",
						status: "unconfigured",
						draftApp: createDefaultDraftApp(),
					}
				: {
						...clonedContent,
						draftApp: {
							...clonedContent.draftApp,
							parameters: clonedContent.draftApp.parameters.map(
								(parameter) => ({
									...parameter,
									id: AppParameterId.generate(),
								}),
							),
						},
					};

		const newNode = {
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: nextContent,
			inputs: newInputs,
			outputs: newOutputs,
		} satisfies AppEntryNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<AppEntryNode>;

type CreateContentGenerationNodeInput = Pick<
	ContentGenerationNode["content"]["languageModel"],
	"id"
> &
	Partial<ContentGenerationNode["content"]["languageModel"]>;

const contentGenerationFactoryImpl = {
	create: (input) => {
		const outputs: Output[] = [
			{
				id: OutputId.generate(),
				label: "Output",
				accessor: "generated-text",
			},
		];
		const languageModel = getEntry(input.id);
		return {
			id: NodeId.generate(),
			type: "operation",
			content: {
				type: "contentGeneration",
				version: "v1",
				prompt: "",
				languageModel: {
					provider: languageModel.providerId,
					id: languageModel.id,
					configuration: languageModel.defaultConfiguration,
				},
				tools: [],
			},
			inputs: [],
			outputs,
		} satisfies ContentGenerationNode;
	},
	clone: (
		orig: ContentGenerationNode,
	): NodeFactoryCloneResult<ContentGenerationNode> => {
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
		} satisfies ContentGenerationNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<
	ContentGenerationNode,
	CreateContentGenerationNodeInput
>;

// --- Factories Manager ---
const factoryImplementations = {
	textGeneration: textGenerationFactoryImpl,
	imageGeneration: imageGenerationFactoryImpl,
	trigger: triggerFactoryImpl,
	action: actionFactoryImpl,
	query: queryFactoryImpl,
	end: endFactoryImpl,
	text: textVariableFactoryImpl,
	file: fileVariableFactoryImpl,
	github: githubVariableFactoryImpl,
	vectorStore: vectorStoreFactoryImpl,
	webPage: webPageFactoryImpl,
	appEntry: appEntryFactoryImpl,
	contentGeneration: contentGenerationFactoryImpl,
} as const;

type CreateArgMap = {
	textGeneration: Parameters<typeof textGenerationFactoryImpl.create>[0];
	imageGeneration: Parameters<typeof imageGenerationFactoryImpl.create>[0];
	trigger: Parameters<typeof triggerFactoryImpl.create>[0];
	action: Parameters<typeof actionFactoryImpl.create>[0];
	query: undefined; // queryFactoryImpl.create is no argument
	end: undefined;
	text: undefined; // textVariableFactoryImpl.create is no argument
	file: Parameters<typeof fileVariableFactoryImpl.create>[0];
	github: Parameters<typeof githubVariableFactoryImpl.create>[0];
	vectorStore: Parameters<typeof vectorStoreFactoryImpl.create>[0];
	webPage: undefined;
	appEntry: undefined;
	contentGeneration: CreateContentGenerationNodeInput;
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

export function createContentGenerationNode(
	input: CreateContentGenerationNodeInput,
): ContentGenerationNode {
	return contentGenerationFactoryImpl.create(input);
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

export function createEndNode(): EndNode {
	return endFactoryImpl.create();
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

export function createGitHubVectorStoreNode(): VectorStoreNode {
	return vectorStoreFactoryImpl.create("github");
}

export function createDocumentVectorStoreNode(): VectorStoreNode {
	return vectorStoreFactoryImpl.create("document");
}

export function createWebPageNode(): WebPageNode {
	return webPageFactoryImpl.create();
}

export function createAppEntryNode() {
	return appEntryFactoryImpl.create();
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
		case "end":
			if (isEndNode(sourceNode)) {
				return endFactoryImpl.clone(sourceNode) as NodeFactoryCloneResult<N>;
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
		case "appEntry":
			if (isAppEntryNode(sourceNode)) {
				return appEntryFactoryImpl.clone(
					sourceNode,
				) as NodeFactoryCloneResult<N>;
			}
			break;
		case "contentGeneration":
			if (isContentGenerationNode(sourceNode)) {
				return contentGenerationFactoryImpl.clone(
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
			case "end":
				return factoryImplementations.end.create();
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
			case "appEntry":
				return factoryImplementations.appEntry.create();
			case "contentGeneration":
				return factoryImplementations.contentGeneration.create(
					arg as CreateArgMap["contentGeneration"],
				);
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
			case "end":
				if (isEndNode(sourceNode)) {
					return factoryImplementations.end.clone(sourceNode);
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
			case "appEntry":
				if (isAppEntryNode(sourceNode)) {
					return factoryImplementations.appEntry.clone(sourceNode);
				}
				break;
			case "contentGeneration":
				if (isContentGenerationNode(sourceNode)) {
					return factoryImplementations.contentGeneration.clone(sourceNode);
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
