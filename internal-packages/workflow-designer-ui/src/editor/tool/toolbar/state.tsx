"use client";

import {
	type FileCategory,
	type FileNode,
	type ImageGenerationLanguageModelData,
	type ImageGenerationNode,
	type Node,
	NodeId,
	type Output,
	OutputId,
	type TextGenerationLanguageModelData,
	type TextGenerationNode,
	type TextNode,
} from "@giselle-sdk/data-type";
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
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
	SelectSourceCategoryTool,
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
				accessor: "text",
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
				accessor: "text",
			},
		],
	} satisfies FileNode;
}

export function textGenerationNode(llm: TextGenerationLanguageModelData) {
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
		type: "action",
		content: {
			type: "textGeneration",
			llm,
		},
		inputs: [],
		outputs,
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
				accessor: "generated-image",
			},
		],
	} satisfies ImageGenerationNode;
}

export function selectSourceCategoryTool() {
	return {
		action: "selectSourceCategory",
		category: "edit",
	} satisfies SelectSourceCategoryTool;
}
