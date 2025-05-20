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
	type Node,
	NodeId,
	type OperationNode,
	type Output,
	OutputId,
	type TextGenerationContent,
	type TextGenerationNode,
	type TextNode,
	type TriggerContent,
	type TriggerNode,
	type UploadedFileData,
	type VariableNode,
} from "@giselle-sdk/data-type";
import type { ActionProvider } from "@giselle-sdk/flow";
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
import { isJsonContent } from "@giselle-sdk/text-editor";
import {
	actionNodeDefaultName,
	defaultName,
	triggerNodeDefaultName,
} from "@giselle-sdk/workflow-utils";
import type { JSONContent } from "@tiptap/react";

type OperationNodeContentType = OperationNode["content"]["type"];
type VariableNodeContentType = VariableNode["content"]["type"];
export type NodeContentType =
	| OperationNodeContentType
	| VariableNodeContentType;

// --- ID Mapping Types and Helpers ---
// Specific IdMap types
interface OutputIdMap {
	[oldId: string]: OutputId; // Value is OutputId
}
interface InputIdMap {
	[oldId: string]: InputId; // Value is InputId
}

interface CloneOutputResult {
	// Specific for Outputs
	newIo: Output[];
	idMap: OutputIdMap;
}

interface CloneInputResult {
	// Specific for Inputs
	newIo: Input[];
	idMap: InputIdMap;
}

function cloneAndRenewOutputIdsWithMap(
	originalOutputs: ReadonlyArray<Output>,
): CloneOutputResult {
	const newOutputs: Output[] = [];
	const idMap: OutputIdMap = {}; // Use OutputIdMap
	for (const o of originalOutputs) {
		const newId = OutputId.generate(); // Returns OutputId
		newOutputs.push({ ...o, id: newId });
		idMap[o.id] = newId;
	}
	return { newIo: newOutputs, idMap };
}

function cloneAndRenewInputIdsWithMap(
	originalInputs: ReadonlyArray<Input>,
): CloneInputResult {
	const newInputs: Input[] = [];
	const idMap: InputIdMap = {}; // Use InputIdMap
	for (const i of originalInputs) {
		const newId = InputId.generate(); // Returns InputId
		newInputs.push({ ...i, id: newId });
		idMap[i.id] = newId;
	}
	return { newIo: newInputs, idMap };
}

// --- Node Factory Interface and Result Type ---
export interface NodeFactoryCloneResult<N extends Node> {
	newNode: N;
	inputIdMap: InputIdMap; // Use specific map type
	outputIdMap: OutputIdMap; // Use specific map type
}

export interface NodeFactory<
	N extends Node,
	CreateArgs extends unknown[] = unknown[],
> {
	create(...args: CreateArgs): N;
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
				const promptJson: JSONContent = JSON.parse(clonedContent.prompt);

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

				const processedPromptContent = keepSourceRefs(promptJson.content);

				if (processedPromptContent && processedPromptContent.length > 0) {
					promptJson.content = processedPromptContent;
					clonedContent.prompt = JSON.stringify(promptJson);
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
} satisfies NodeFactory<TextGenerationNode, [TextGenerationContent["llm"]]>;

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
} satisfies NodeFactory<ImageGenerationNode, [ImageGenerationContent["llm"]]>;

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
} satisfies NodeFactory<TriggerNode, [TriggerContent["provider"]]>;

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
		} satisfies ActionNode;
		return { newNode, inputIdMap, outputIdMap };
	},
} satisfies NodeFactory<ActionNode, [ActionProvider]>;

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
} satisfies NodeFactory<TextNode, [text?: string]>;

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
			(
				fileData: FileData,
			): FileData & {
				originalFileIdForCopy: FileId;
			} => {
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
} satisfies NodeFactory<FileNode, [category: FileContent["category"]]>;

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
} satisfies NodeFactory<
	GitHubNode,
	[objectReferences?: GitHubContent["objectReferences"]]
>;

// --- Factories Manager ---

type NodeMap = {
	textGeneration: TextGenerationNode;
	imageGeneration: ImageGenerationNode;
	trigger: TriggerNode;
	action: ActionNode;
	text: TextNode;
	file: FileNode;
	github: GitHubNode;
};

type CreateArgsMap = {
	textGeneration: Parameters<typeof textGenerationFactoryImpl.create>;
	imageGeneration: Parameters<typeof imageGenerationFactoryImpl.create>;
	trigger: Parameters<typeof triggerFactoryImpl.create>;
	action: Parameters<typeof actionFactoryImpl.create>;
	text: Parameters<typeof textVariableFactoryImpl.create>;
	file: Parameters<typeof fileVariableFactoryImpl.create>;
	github: Parameters<typeof githubVariableFactoryImpl.create>;
};

export interface CloneResultWithMappings {
	newNode: Node;
	inputIdMap: InputIdMap; // Use specific map type
	outputIdMap: OutputIdMap; // Use specific map type
}

function cloneInternal<K extends NodeContentType>(
	sourceNode: NodeMap[K],
): NodeFactoryCloneResult<NodeMap[K]> {
	const type = sourceNode.content.type as K;
	switch (type) {
		case "textGeneration": {
			return textGenerationFactoryImpl.clone(
				sourceNode as TextGenerationNode,
			) as NodeFactoryCloneResult<NodeMap[K]>;
		}
		case "imageGeneration": {
			return imageGenerationFactoryImpl.clone(
				sourceNode as ImageGenerationNode,
			) as NodeFactoryCloneResult<NodeMap[K]>;
		}
		case "trigger": {
			return triggerFactoryImpl.clone(
				sourceNode as TriggerNode,
			) as NodeFactoryCloneResult<NodeMap[K]>;
		}
		case "action": {
			return actionFactoryImpl.clone(
				sourceNode as ActionNode,
			) as NodeFactoryCloneResult<NodeMap[K]>;
		}
		case "text": {
			return textVariableFactoryImpl.clone(
				sourceNode as TextNode,
			) as NodeFactoryCloneResult<NodeMap[K]>;
		}
		case "file": {
			return fileVariableFactoryImpl.clone(
				sourceNode as FileNode,
			) as NodeFactoryCloneResult<NodeMap[K]>;
		}
		case "github": {
			return githubVariableFactoryImpl.clone(
				sourceNode as GitHubNode,
			) as NodeFactoryCloneResult<NodeMap[K]>;
		}
		default: {
			const _exhaustiveCheck: never = type;
			throw new Error(`No clone logic for content type: ${type}`);
		}
	}
}

function createInternal<K extends NodeContentType>(
	type: K,
	...args: CreateArgsMap[K]
): NodeMap[K] {
	switch (type) {
		case "textGeneration": {
			return textGenerationFactoryImpl.create(
				...(args as CreateArgsMap["textGeneration"]),
			) as NodeMap[K];
		}
		case "imageGeneration": {
			return imageGenerationFactoryImpl.create(
				...(args as CreateArgsMap["imageGeneration"]),
			) as NodeMap[K];
		}
		case "trigger": {
			return triggerFactoryImpl.create(
				...(args as CreateArgsMap["trigger"]),
			) as NodeMap[K];
		}
		case "action": {
			return actionFactoryImpl.create(
				...(args as CreateArgsMap["action"]),
			) as NodeMap[K];
		}
		case "text": {
			return textVariableFactoryImpl.create(
				...(args as CreateArgsMap["text"]),
			) as NodeMap[K];
		}
		case "file": {
			return fileVariableFactoryImpl.create(
				...(args as CreateArgsMap["file"]),
			) as NodeMap[K];
		}
		case "github": {
			return githubVariableFactoryImpl.create(
				...(args as CreateArgsMap["github"]),
			) as NodeMap[K];
		}
		default: {
			const _exhaustiveCheck: never = type;
			throw new Error(`No create logic for content type: ${type}`);
		}
	}
}

export const nodeFactories = {
	create: <K extends NodeContentType>(
		type: K,
		...args: CreateArgsMap[K]
	): NodeMap[K] => {
		return createInternal(type, ...args);
	},
	clone: (sourceNode: Node): CloneResultWithMappings => {
		const type = sourceNode.content.type as NodeContentType;
		switch (type) {
			case "textGeneration": {
				return cloneInternal(sourceNode as TextGenerationNode);
			}
			case "imageGeneration": {
				return cloneInternal(sourceNode as ImageGenerationNode);
			}
			case "trigger": {
				return cloneInternal(sourceNode as TriggerNode);
			}
			case "action": {
				return cloneInternal(sourceNode as ActionNode);
			}
			case "text": {
				return cloneInternal(sourceNode as TextNode);
			}
			case "file": {
				return cloneInternal(sourceNode as FileNode);
			}
			case "github": {
				return cloneInternal(sourceNode as GitHubNode);
			}
			default: {
				const _exhaustiveCheck: never = type;
				throw new Error(`No clone logic for content type: ${type}`);
			}
		}
	},
};
