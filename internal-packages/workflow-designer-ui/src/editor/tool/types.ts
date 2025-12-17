import type { Node } from "@giselles-ai/protocol";

interface ToolBase {
	category: string;
	action: string;
}

export interface AddNodeTool extends ToolBase {
	category: "edit";
	action: "addNode";
	node: Node;
}

export interface SelectLanguageModelTool extends ToolBase {
	category: "edit";
	action: "selectLanguageModel";
}
export interface SelectLanguageModelV2Tool extends ToolBase {
	category: "edit";
	action: "selectLanguageModelV2";
}

export interface SelectFileNodeCategoryTool extends ToolBase {
	category: "edit";
	action: "selectFileNodeCategory";
}

export interface SelectSourceCategoryTool extends ToolBase {
	category: "edit";
	action: "selectSourceCategory";
}
export interface SelectContextTool extends ToolBase {
	category: "edit";
	action: "selectContext";
}
export interface SelectTriggerTool extends ToolBase {
	category: "edit";
	action: "selectTrigger";
}
export interface SelectGitHubTriggerTool extends ToolBase {
	category: "edit";
	action: "selectGithubTrigger";
}
export interface SelectIntegrationTool extends ToolBase {
	category: "edit";
	action: "selectIntegration";
}
export interface SelectEnviromentActionTool extends ToolBase {
	category: "edit";
	action: "selectAction";
}
export interface MoveTool extends ToolBase {
	category: "move";
	action: "move";
}
export interface SelectRetrievalCategoryTool extends ToolBase {
	category: "edit";
	action: "selectRetrievalCategory";
}
export type Tool =
	| MoveTool
	| AddNodeTool
	| SelectFileNodeCategoryTool
	| SelectLanguageModelTool
	| SelectSourceCategoryTool
	| SelectContextTool
	| SelectTriggerTool
	| SelectGitHubTriggerTool
	| SelectIntegrationTool
	| SelectEnviromentActionTool
	| SelectRetrievalCategoryTool
	| SelectLanguageModelV2Tool;

type ToolAction = Tool["action"];

export function isToolAction(args: unknown): args is ToolAction {
	if (typeof args === "string") {
		return (
			args === "move" ||
			args === "addNode" ||
			args === "selectLanguageModel" ||
			args === "selectFileNodeCategory" ||
			args === "selectSourceCategory" ||
			args === "selectContext" ||
			args === "selectTrigger" ||
			args === "selectGithubTrigger" ||
			args === "selectIntegration" ||
			args === "selectAction" ||
			args === "selectRetrievalCategory" ||
			args === "selectLanguageModelV2"
		);
	}
	return false;
}
