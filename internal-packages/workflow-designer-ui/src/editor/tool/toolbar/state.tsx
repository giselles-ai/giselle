"use client";

import {
	type ActionNode,
	type FileCategory,
	type FileNode,
	type ImageGenerationLanguageModelData,
	type ImageGenerationNode,
	type Input,
	InputId,
	type Node,
	NodeId,
	type Output,
	OutputId,
	type TextGenerationLanguageModelData,
	type TextGenerationNode,
	type TextNode,
	type TriggerNode,
} from "@giselle-sdk/data-type";
import type { ActionProvider, TriggerProvider } from "@giselle-sdk/flow";
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
import { nodeFactories } from "@giselle-sdk/workflow-designer";
import {
	actionNodeDefaultName,
	triggerNodeDefaultName,
} from "@giselle-sdk/workflow-utils";
import { type ReactNode, createContext, useContext, useState } from "react";
import type {
	AddFileNodeTool,
	AddGitHubNodeTool,
	AddImageGenerationNodeTool,
	AddNodeTool,
	AddTextGenerationNodeTool,
	AddTextNodeTool,
	MoveTool,
	SelectEnviromentActionTool,
	SelectFileNodeCategoryTool,
	SelectLanguageModelTool,
	SelectSourceCategoryTool,
	SelectTriggerTool,
	Tool,
} from "../types";

interface ToolbarContext {
	selectedTool: Tool;
	setSelectedTool: (tool: Tool) => void;
	reset: () => void;
}

const ToolbarContext = createContext<ToolbarContext | undefined>(undefined);

export function ToolbarContextProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [selectedTool, setSelectedTool] = useState<Tool>({
		action: "move",
		category: "move",
	});

	// Reset the toolbar
	const reset = () => {
		setSelectedTool(moveTool());
	};

	return (
		<ToolbarContext.Provider
			value={{
				selectedTool,
				setSelectedTool,
				reset,
			}}
		>
			{children}
		</ToolbarContext.Provider>
	);
}

export function useToolbar() {
	const context = useContext(ToolbarContext);
	if (context === undefined) {
		throw new Error("useToolbar must be used within a ToolbarContextProvider");
	}
	return context;
}

export function moveTool() {
	return {
		action: "move",
		category: "move",
	} satisfies MoveTool;
}

export function addFileNodeTool(fileCategory?: FileCategory) {
	return {
		action: "addFileNode",
		category: "edit",
		fileCategory,
	} satisfies AddFileNodeTool;
}

export function addTextGenerationNodeTool(
	languageModel?: TextGenerationLanguageModelData,
) {
	return {
		action: "addTextGenerationNode",
		category: "edit",
		languageModel,
	} satisfies AddTextGenerationNodeTool;
}

export function addImageGenerationNodeTool(
	languageModel?: ImageGenerationLanguageModelData,
) {
	return {
		action: "addImageGenerationNode",
		category: "edit",
		languageModel,
	} satisfies AddImageGenerationNodeTool;
}

export function selectFileNodeCategoryTool() {
	return {
		action: "selectFileNodeCategory",
		category: "edit",
	} satisfies SelectFileNodeCategoryTool;
}

export function selectLanguageModelTool() {
	return {
		action: "selectLanguageModel",
		category: "edit",
	} satisfies SelectLanguageModelTool;
}

export function addTextNodeTool() {
	return {
		action: "addTextNode",
		category: "edit",
	} satisfies AddTextNodeTool;
}

export function addNodeTool(node: Node) {
	return {
		action: "addNode",
		category: "edit",
		node,
	} satisfies AddNodeTool;
}

export function textNode() {
	return nodeFactories.create("text");
}

export function triggerNode(triggerProvider: TriggerProvider) {
	return nodeFactories.create(
		"trigger",
		triggerProvider,
		triggerNodeDefaultName(triggerProvider),
	);
}

export function actionNode(actionProvider: ActionProvider) {
	return nodeFactories.create(
		"action",
		actionProvider,
		actionNodeDefaultName(actionProvider),
	);
}

export function fileNode(category: FileCategory) {
	return nodeFactories.create("file", category);
}

export function textGenerationNode(llm: TextGenerationLanguageModelData) {
	return nodeFactories.create("textGeneration", llm);
}

export function imageGenerationNode(llm: ImageGenerationLanguageModelData) {
	return nodeFactories.create("imageGeneration", llm);
}

export function selectSourceCategoryTool() {
	return {
		action: "selectSourceCategory",
		category: "edit",
	} satisfies SelectSourceCategoryTool;
}

export function selectTriggerTool() {
	return {
		action: "selectTrigger",
		category: "edit",
	} satisfies SelectTriggerTool;
}

export function selectActionTool() {
	return {
		action: "selectAction",
		category: "edit",
	} satisfies SelectEnviromentActionTool;
}
