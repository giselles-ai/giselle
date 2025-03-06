import type { FileCategory } from "@giselle-sdk/data-type";
import type { LanguageModel } from "@giselle-sdk/language-model";

interface ToolBase {
	category: string;
	action: string;
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
	languageModel?: LanguageModel;
}
export interface AddGitHubNodeTool extends ToolBase {
	category: "edit";
	action: "addGitHubNode";
}
export interface MoveTool extends ToolBase {
	category: "move";
	action: "move";
}
export type Tool =
	| AddTextNodeTool
	| AddFileNodeTool
	| AddTextGenerationNodeTool
	| AddGitHubNodeTool
	| MoveTool;

type ToolAction =
	| AddTextNodeTool["action"]
	| AddFileNodeTool["action"]
	| AddTextGenerationNodeTool["action"]
	| AddGitHubNodeTool["action"]
	| MoveTool["action"];

export function isToolAction(args: unknown): args is ToolAction {
	if (typeof args === "string") {
		return (
			args === "addTextNode" ||
			args === "addFileNode" ||
			args === "addTextGenerationNode" ||
			args === "addGitHubNode" ||
			args === "move"
		);
	}
	return false;
}
