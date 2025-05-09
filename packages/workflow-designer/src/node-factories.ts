import {
	type ActionNode,
	type ActionProvider,
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
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
import { isJsonContent } from "@giselle-sdk/text-editor";
import { defaultName } from "@giselle-sdk/workflow-utils";
import type { JSONContent } from "@tiptap/react";

type OperationNodeContentType = OperationNode["content"]["type"];
type VariableNodeContentType = VariableNode["content"]["type"];
export type NodeContentType =
	| OperationNodeContentType
	| VariableNodeContentType;

export interface NodeFactory<
	N extends Node,
	CreateArgs extends unknown[] = unknown[],
> {
	create(...args: CreateArgs): N;
	clone(orig: N): N;
}

// --- Helper functions ---

function cloneAndRenewOutputIds(
	originalOutputs: ReadonlyArray<Output>,
): Output[] {
	return originalOutputs.map((o) => ({
		...o,
		id: OutputId.generate(),
	}));
}

function cloneAndRenewInputIds(originalInputs: ReadonlyArray<Input>): Input[] {
	return originalInputs.map((i) => ({
		...i,
		id: InputId.generate(),
	}));
}

function hasProviderOptions(fileData: FileData): fileData is UploadedFileData {
	return fileData.status === "uploaded" && "providerOptions" in fileData;
}

function removeSourceRefsFromPrompt(
	content: JSONContent[] | undefined,
): JSONContent[] | undefined {
	if (!content) return undefined;
	return content
		.filter((item) => item.type !== "Source")
		.map((item) => {
			if (item.content) {
				return { ...item, content: removeSourceRefsFromPrompt(item.content) };
			}
			return item;
		})
		.filter((item) => !(item.type === "text" && !item.text?.trim()));
}

// --- Concrete Node Factories (Simplified Clone Logic) ---

const textGenerationFactoryImpl = {
	create: (llm: TextGenerationContent["llm"]): TextGenerationNode => {
		const outputs: Output[] = [
			{ id: OutputId.generate(), label: "Output", accessor: "generated-text" },
		];
		const model = languageModels.find((m) => m.id === llm.id);
		if (
			model !== undefined &&
			hasCapability(model, Capability.SearchGrounding)
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
			content: { type: "textGeneration", llm, prompt: "" },
			inputs: [],
			outputs,
		} as TextGenerationNode;
	},
	clone: (orig: TextGenerationNode): TextGenerationNode => {
		const clonedContent = structuredClone(orig.content);

		// Clean prompt from source references
		if (clonedContent.prompt && isJsonContent(clonedContent.prompt)) {
			try {
				const promptJson: JSONContent = JSON.parse(clonedContent.prompt);
				const cleanedPromptContent = removeSourceRefsFromPrompt(
					promptJson.content,
				);
				if (cleanedPromptContent && cleanedPromptContent.length > 0) {
					promptJson.content = cleanedPromptContent;
					clonedContent.prompt = JSON.stringify(promptJson);
				} else {
					clonedContent.prompt = "";
				}
			} catch (e) {
				console.error("Error processing prompt for TextGeneration clone:", e);
				// Fallback: clear prompt or keep original based on desired behavior
				// clonedContent.prompt = "";
			}
		}

		return {
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: [], // TextGenerationNode inputs are reset
			outputs: cloneAndRenewOutputIds(orig.outputs),
		} as TextGenerationNode;
	},
} satisfies NodeFactory<TextGenerationNode, [TextGenerationContent["llm"]]>;

const imageGenerationFactoryImpl = {
	create: (llm: ImageGenerationContent["llm"]): ImageGenerationNode =>
		({
			id: NodeId.generate(),
			type: "operation",
			content: { type: "imageGeneration", llm, prompt: "" },
			inputs: [],
			outputs: [
				{
					id: OutputId.generate(),
					label: "Output",
					accessor: "generated-image",
				},
			],
		}) as ImageGenerationNode,
	clone: (orig: ImageGenerationNode): ImageGenerationNode =>
		({
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: structuredClone(orig.content), // Simple deep clone
			inputs: [], // ImageGenerationNode inputs are reset
			outputs: cloneAndRenewOutputIds(orig.outputs),
		}) as ImageGenerationNode,
} satisfies NodeFactory<ImageGenerationNode, [ImageGenerationContent["llm"]]>;

const triggerFactoryImpl = {
	create: (
		provider: TriggerContent["provider"],
		outputsFromTriggerDef: Output[],
	): TriggerNode =>
		({
			id: NodeId.generate(),
			type: "operation",
			content: {
				type: "trigger",
				provider,
				state: { status: "unconfigured" }, // Set initial state
			},
			inputs: [],
			outputs: cloneAndRenewOutputIds(outputsFromTriggerDef),
		}) as TriggerNode,
	clone: (orig: TriggerNode): TriggerNode => {
		const clonedContent = structuredClone(orig.content);
		// Reset state to unconfigured
		clonedContent.state = { status: "unconfigured" };

		return {
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: [], // TriggerNode inputs are reset
			outputs: cloneAndRenewOutputIds(orig.outputs),
		} as TriggerNode;
	},
} satisfies NodeFactory<TriggerNode, [TriggerContent["provider"], Output[]]>;

const actionFactoryImpl = {
	create: (
		providerType: ActionProvider["type"],
		actionId: string,
		inputsFromActionDef: Input[],
	): ActionNode =>
		({
			id: NodeId.generate(),
			type: "operation",
			content: {
				type: "action",
				provider: { type: providerType, actionId }, // Create ActionProviderLike
			},
			inputs: cloneAndRenewInputIds(inputsFromActionDef),
			outputs: [],
		}) as ActionNode,
	clone: (orig: ActionNode): ActionNode =>
		({
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: structuredClone(orig.content), // Simple deep clone, provider is ActionProviderLike
			inputs: cloneAndRenewInputIds(orig.inputs), // ActionNode inputs are preserved with new IDs
			outputs: cloneAndRenewOutputIds(orig.outputs),
		}) as ActionNode,
} satisfies NodeFactory<ActionNode, [ActionProvider["type"], string, Input[]]>;

const textVariableFactoryImpl = {
	create: (text = ""): TextNode =>
		({
			id: NodeId.generate(),
			type: "variable",
			content: { type: "text", text },
			inputs: [],
			outputs: [{ id: OutputId.generate(), label: "Output", accessor: "text" }],
		}) as TextNode,
	clone: (orig: TextNode): TextNode =>
		({
			id: NodeId.generate(),
			type: "variable",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: structuredClone(orig.content), // Simple deep clone
			inputs: [], // VariableNode inputs are reset
			outputs: cloneAndRenewOutputIds(orig.outputs),
		}) as TextNode,
} satisfies NodeFactory<TextNode, [text?: string]>;

const fileVariableFactoryImpl = {
	create: (category: FileContent["category"] = "pdf"): FileNode =>
		({
			id: NodeId.generate(),
			type: "variable",
			content: { type: "file", category, files: [] },
			inputs: [],
			outputs: [{ id: OutputId.generate(), label: "Output", accessor: "text" }],
		}) as FileNode,
	clone: (orig: FileNode): FileNode => {
		const clonedContent = structuredClone(orig.content);
		// Renew File IDs and clear providerOptions
		clonedContent.files = clonedContent.files.map((fileData): FileData => {
			const newFileId = FileId.generate();
			if (hasProviderOptions(fileData)) {
				const { providerOptions, ...rest } = fileData;
				return { ...rest, id: newFileId };
			}
			return { ...fileData, id: newFileId };
		});
		return {
			id: NodeId.generate(),
			type: "variable",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: [], // VariableNode inputs are reset
			outputs: cloneAndRenewOutputIds(orig.outputs),
		} as FileNode;
	},
} satisfies NodeFactory<FileNode, [category?: FileContent["category"]]>;

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
		}) as GitHubNode,
	clone: (orig: GitHubNode): GitHubNode =>
		({
			id: NodeId.generate(),
			type: "variable",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: structuredClone(orig.content), // Simple deep clone
			inputs: [], // VariableNode inputs are reset
			outputs: cloneAndRenewOutputIds(orig.outputs),
		}) as GitHubNode,
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

function cloneInternal<K extends NodeContentType>(
	sourceNode: NodeMap[K],
): NodeMap[K] {
	const type = sourceNode.content.type as K;
	switch (type) {
		case "textGeneration": {
			return textGenerationFactoryImpl.clone(
				sourceNode as TextGenerationNode,
			) as NodeMap[K];
		}
		case "imageGeneration": {
			return imageGenerationFactoryImpl.clone(
				sourceNode as ImageGenerationNode,
			) as NodeMap[K];
		}
		case "trigger": {
			return triggerFactoryImpl.clone(sourceNode as TriggerNode) as NodeMap[K];
		}
		case "action": {
			return actionFactoryImpl.clone(sourceNode as ActionNode) as NodeMap[K];
		}
		case "text": {
			return textVariableFactoryImpl.clone(
				sourceNode as TextNode,
			) as NodeMap[K];
		}
		case "file": {
			return fileVariableFactoryImpl.clone(
				sourceNode as FileNode,
			) as NodeMap[K];
		}
		case "github": {
			return githubVariableFactoryImpl.clone(
				sourceNode as GitHubNode,
			) as NodeMap[K];
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

export const factories = {
	create: <K extends NodeContentType>(
		type: K,
		...args: CreateArgsMap[K]
	): NodeMap[K] => {
		return createInternal(type, ...args);
	},
	clone: (sourceNode: Node): Node => {
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
