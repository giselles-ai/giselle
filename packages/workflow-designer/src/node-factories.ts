import {
	type ActionContent,
	type ActionNode,
	type FileContent,
	type FileData,
	FileId,
	type FileNode,
	type GitHubActionProvider,
	type GitHubContent,
	type GitHubNode,
	type GitHubTriggerProvider,
	type ImageGenerationContent,
	type ImageGenerationNode,
	type Input,
	InputId,
	type Node,
	NodeId,
	type Output,
	OutputId,
	type TextContent,
	type TextGenerationContent,
	type TextGenerationNode,
	type TextNode,
	type ToolSet,
	type TriggerContent,
	type TriggerNode,
	type UploadedFileData,
} from "@giselle-sdk/data-type";
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
import { isJsonContent } from "@giselle-sdk/text-editor";
import { defaultName } from "@giselle-sdk/workflow-utils";
import type { JSONContent } from "@tiptap/react";

// Factory interface
export interface NodeFactory<N extends Node> {
	create(...args: any[]): N; // create might take specific arguments
	clone(orig: N): N;
}

// --- Helper functions (can be co-located or imported from a utility) ---

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

// Type guard for FileData with providerOptions
function hasProviderOptions(fileData: FileData): fileData is UploadedFileData {
	return fileData.status === "uploaded" && "providerOptions" in fileData;
}

// Recursive function to remove "Source" type nodes from TipTap JSON
function removeSourceRefsFromPrompt(
	content: JSONContent[] | undefined,
): JSONContent[] | undefined {
	if (!content) return undefined;
	return content
		.filter((item) => item.type !== "Source") // Remove "Source" type nodes
		.map((item) => {
			if (item.content) {
				return { ...item, content: removeSourceRefsFromPrompt(item.content) };
			}
			return item;
		})
		.filter((item) => !(item.type === "text" && !item.text?.trim())); // Remove empty text nodes
}

// Type guard for GitHubTriggerProvider (if needed, or rely on structure)
function isGitHubTriggerProvider(
	provider: TriggerContent["provider"],
): provider is GitHubTriggerProvider {
	return provider.type === "github" && "auth" in provider;
}

// Type guard for GitHubActionProvider (if needed, or rely on structure)
function isGitHubActionProvider(
	provider: ActionContent["provider"],
): provider is GitHubActionProvider {
	return provider.type === "github" && "auth" in provider;
}

// --- OperationNode Factories ---

export const textGenerationFactory = {
	create: (llm: TextGenerationContent["llm"]) => {
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
			content: { type: "textGeneration", llm, prompt: "" }, // Initialize with empty prompt
			inputs: [],
			outputs,
		};
	},
	clone: (orig: TextGenerationNode) => {
		const clonedContent = structuredClone(orig.content);

		// Clear sensitive info from tools
		if (clonedContent.tools) {
			const newTools: Partial<ToolSet> = {};
			if (clonedContent.tools.github && !clonedContent.tools.github.auth) {
				newTools.github = structuredClone(clonedContent.tools.github);
			}
			if (
				clonedContent.tools.postgres &&
				!clonedContent.tools.postgres.connectionString
			) {
				newTools.postgres = structuredClone(clonedContent.tools.postgres);
			}
			if (clonedContent.tools.openaiWebSearch) {
				newTools.openaiWebSearch = structuredClone(
					clonedContent.tools.openaiWebSearch,
				);
			}
			if (Object.keys(newTools).length > 0) {
				clonedContent.tools = newTools;
			} else {
				clonedContent.tools = undefined; // Remove tools if all sensitive parts were stripped
			}
		}

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
					clonedContent.prompt = ""; // Set to empty if all content was source refs
				}
			} catch (e) {
				console.error(
					"Failed to parse or clean prompt JSON during clone (TextGeneration):",
					e,
				);
				// Decide fallback: keep original, or clear? For safety, maybe clear.
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
		};
	},
} satisfies NodeFactory<TextGenerationNode>;

export const imageGenerationFactory = {
	create: (llm: ImageGenerationContent["llm"]) => {
		return {
			id: NodeId.generate(),
			type: "operation",
			content: { type: "imageGeneration", llm, prompt: "" }, // Initialize with empty prompt
			inputs: [],
			outputs: [
				{
					id: OutputId.generate(),
					label: "Output",
					accessor: "generated-image",
				},
			],
		};
	},
	clone: (orig: ImageGenerationNode) => {
		const clonedContent = structuredClone(orig.content);
		// Potentially clean prompt if it can also contain source refs, similar to TextGeneration
		// For now, assuming ImageGeneration prompt is simpler or doesn't use SourceExtension
		return {
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: [], // ImageGenerationNode inputs are reset
			outputs: cloneAndRenewOutputIds(orig.outputs),
		};
	},
} satisfies NodeFactory<ImageGenerationNode>;

export const triggerFactory = {
	create: (
		provider: TriggerContent["provider"],
		outputsFromTriggerDef: Output[],
	) => {
		return {
			id: NodeId.generate(),
			type: "operation",
			content: { type: "trigger", provider },
			inputs: [],
			outputs: cloneAndRenewOutputIds(outputsFromTriggerDef), // Use helper
		};
	},
	clone: (orig: TriggerNode) => {
		const clonedContent = structuredClone(orig.content);
		// Reset auth for GitHub triggers
		if (
			isGitHubTriggerProvider(clonedContent.provider) &&
			clonedContent.provider.auth.state === "authenticated"
		) {
			clonedContent.provider = {
				...clonedContent.provider,
				auth: { state: "unauthenticated" },
			};
		}
		return {
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: [], // TriggerNode inputs are reset
			outputs: cloneAndRenewOutputIds(orig.outputs),
		};
	},
} satisfies NodeFactory<TriggerNode>;

export const actionFactory = {
	create: (
		provider: ActionContent["provider"],
		inputsFromActionDef: Input[],
	) => {
		return {
			id: NodeId.generate(),
			type: "operation",
			content: { type: "action", provider },
			inputs: cloneAndRenewInputIds(inputsFromActionDef), // Use helper
			outputs: [],
		};
	},
	clone: (orig: ActionNode) => {
		const clonedContent = structuredClone(orig.content);
		// Reset auth for GitHub actions
		if (
			isGitHubActionProvider(clonedContent.provider) &&
			clonedContent.provider.auth.state === "authenticated"
		) {
			clonedContent.provider = {
				...clonedContent.provider,
				auth: { state: "unauthenticated" },
			};
		}
		return {
			id: NodeId.generate(),
			type: "operation",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: cloneAndRenewInputIds(orig.inputs), // ActionNode inputs are preserved
			outputs: cloneAndRenewOutputIds(orig.outputs),
		};
	},
} satisfies NodeFactory<ActionNode>;

// --- VariableNode Factories ---

export const textVariableFactory = {
	create: (text = "") => {
		return {
			id: NodeId.generate(),
			type: "variable",
			content: { type: "text", text },
			inputs: [],
			outputs: [{ id: OutputId.generate(), label: "Output", accessor: "text" }],
		};
	},
	clone: (orig: TextNode) => {
		return {
			id: NodeId.generate(),
			type: "variable",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: structuredClone(orig.content),
			inputs: [], // VariableNode inputs are reset
			outputs: cloneAndRenewOutputIds(orig.outputs),
		};
	},
} satisfies NodeFactory<TextNode>;

export const fileVariableFactory = {
	create: (category: FileContent["category"] = "pdf") => {
		return {
			id: NodeId.generate(),
			type: "variable",
			content: { type: "file", category, files: [] },
			inputs: [],
			outputs: [{ id: OutputId.generate(), label: "Output", accessor: "text" }],
		};
	},
	clone: (orig: FileNode) => {
		const clonedContent = structuredClone(orig.content);
		// Renew File IDs and clear providerOptions
		clonedContent.files = clonedContent.files.map((fileData) => {
			const { providerOptions, ...restOfFileData } = hasProviderOptions(
				fileData,
			)
				? fileData
				: fileData;
			return {
				...restOfFileData,
				id: FileId.generate(),
			};
		});
		return {
			id: NodeId.generate(),
			type: "variable",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: clonedContent,
			inputs: [], // VariableNode inputs are reset
			outputs: cloneAndRenewOutputIds(orig.outputs),
		};
	},
} satisfies NodeFactory<FileNode>;

export const githubVariableFactory = {
	create: (objectReferences: GitHubContent["objectReferences"] = []) => {
		return {
			id: NodeId.generate(),
			type: "variable",
			content: { type: "github", objectReferences },
			inputs: [],
			outputs: [{ id: OutputId.generate(), label: "Output", accessor: "text" }],
		};
	},
	clone: (orig: GitHubNode) => {
		return {
			id: NodeId.generate(),
			type: "variable",
			name: `Copy of ${orig.name ?? defaultName(orig)}`,
			content: structuredClone(orig.content), // GitHub object references are just data
			inputs: [], // VariableNode inputs are reset
			outputs: cloneAndRenewOutputIds(orig.outputs),
		};
	},
} satisfies NodeFactory<GitHubNode>;

// Map all factories by content.type
export const nodeFactories: Record<string, NodeFactory<Node>> = {
	textGeneration: textGenerationFactory,
	imageGeneration: imageGenerationFactory,
	trigger: triggerFactory,
	action: actionFactory,
	text: textVariableFactory,
	file: fileVariableFactory,
	github: githubVariableFactory,
};
