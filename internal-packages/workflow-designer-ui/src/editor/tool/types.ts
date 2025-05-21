import type { Node } from "@giselle-sdk/data-type";

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

export interface SelectFileNodeCategoryTool extends ToolBase {
	category: "edit";
	action: "selectFileNodeCategory";
}

export interface SelectSourceCategoryTool extends ToolBase {
	category: "edit";
	action: "selectSourceCategory";
}
export interface SelectTriggerTool extends ToolBase {
	category: "edit";
	action: "selectTrigger";
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
	| SelectTriggerTool
	| SelectEnviromentActionTool
	| SelectRetrievalCategoryTool;

type ToolAction = Tool["action"];

export function isToolAction(args: unknown): args is ToolAction {
	if (typeof args === "string") {
		return (
			args === "move" ||
			args === "addNode" ||
			args === "selectLanguageModel" ||
			args === "selectFileNodeCategory" ||
			args === "selectSourceCategory" ||
			args === "selectTrigger" ||
			args === "selectAction" ||
			args === "selectRetrievalCategory"
		);
	}
	return false;
}
