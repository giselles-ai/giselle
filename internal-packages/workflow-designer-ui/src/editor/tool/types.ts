import type {
	FileCategory,
	ImageGenerationLanguageModelData,
	Node,
	TextGenerationLanguageModelData,
} from "@giselle-sdk/data-type";
import type { LanguageModel } from "@giselle-sdk/language-model";

interface ToolBase {
	category: string;
	action: string;
}

export interface AddNodeTool extends ToolBase {
	category: "edit";
	action: "addNode";
	node: Node;
}

export interface AddTextNodeTool extends ToolBase {
	category: "edit";
	action: "addTextNode";
}
export interface AddFileNodeTool extends ToolBase {
	category: "edit";
	action: "addFileNode";
	fileCategory?: FileCategory;
}
export interface AddTextGenerationNodeTool extends ToolBase {
	category: "edit";
	action: "addTextGenerationNode";
	languageModel?: TextGenerationLanguageModelData;
}
export interface AddImageGenerationNodeTool extends ToolBase {
	category: "edit";
	action: "addImageGenerationNode";
	languageModel?: ImageGenerationLanguageModelData;
}
export interface MoveTool extends ToolBase {
	category: "move";
	action: "move";
}
export interface AddGitHubNodeTool extends ToolBase {
	category: "edit";
	action: "addGitHubNode";
}
export type Tool =
	| AddTextNodeTool
	| AddFileNodeTool
	| AddTextGenerationNodeTool
	| MoveTool
	| AddGitHubNodeTool
	| AddNodeTool;

type ToolAction =
	| AddTextNodeTool["action"]
	| AddFileNodeTool["action"]
	| AddTextGenerationNodeTool["action"]
	| AddGitHubNodeTool["action"]
	| MoveTool["action"]
	| AddNodeTool["action"];

export function isToolAction(args: unknown): args is ToolAction {
	if (typeof args === "string") {
		return (
			args === "addTextNode" ||
			args === "addFileNode" ||
			args === "addTextGenerationNode" ||
			args === "move" ||
			args === "addNode"
		);
	}
	return false;
}

export function isAddGitHubNodeToolAction(
	action: string,
): action is AddGitHubNodeTool["action"] {
	return action === "addGitHubNode";
}
