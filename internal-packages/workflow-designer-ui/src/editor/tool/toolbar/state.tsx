"use client";

import {
	type FileCategory,
	type FileNode,
	type ImageGenerationLanguageModelData,
	type ImageGenerationNode,
	type Node,
	NodeId,
	OutputId,
	type TextGenerationLanguageModelData,
	type TextGenerationNode,
	type TextNode,
} from "@giselle-sdk/data-type";
import { type ReactNode, createContext, useContext, useState } from "react";
import type {
	AddFileNodeTool,
	AddGitHubNodeTool,
	AddImageGenerationNodeTool,
	AddNodeTool,
	AddTextGenerationNodeTool,
	AddTextNodeTool,
	MoveTool,
	SelectFileNodeCategoryTool,
	SelectLanguageModelTool,
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
	return {
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
				accesor: "text",
			},
		],
	} satisfies TextNode;
}

export function fileNode(category: FileCategory) {
	return {
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
				accesor: "text",
			},
		],
	} satisfies FileNode;
}

export function textGenerationNode(llm: TextGenerationLanguageModelData) {
	return {
		id: NodeId.generate(),
		type: "action",
		content: {
			type: "textGeneration",
			llm,
		},
		inputs: [],
		outputs: [
			{
				id: OutputId.generate(),
				label: "Output",
				accesor: "generated-text",
			},
		],
	} satisfies TextGenerationNode;
}

export function imageGenerationNode(llm: ImageGenerationLanguageModelData) {
	return {
		id: NodeId.generate(),
		type: "action",
		content: {
			type: "imageGeneration",
			llm,
		},
		inputs: [],
		outputs: [
			{
				id: OutputId.generate(),
				label: "Output",
				accesor: "generated-image",
			},
		],
	} satisfies ImageGenerationNode;
}
