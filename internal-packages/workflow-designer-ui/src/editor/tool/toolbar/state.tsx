"use client";

import type {
	ActionNode,
	FileCategory,
	FileNode,
	ImageGenerationLanguageModelData,
	ImageGenerationNode,
	Node,
	Output,
	QueryNode,
	TextGenerationLanguageModelData,
	TextGenerationNode,
	TextNode,
	TriggerNode,
	VectorStoreContent,
	VectorStoreNode,
} from "@giselle-sdk/data-type";
import { NodeId, OutputId } from "@giselle-sdk/data-type";
import type { ActionProvider, TriggerProvider } from "@giselle-sdk/flow";
import {
	Capability,
	hasCapability,
	languageModels,
} from "@giselle-sdk/language-model";
import { type ReactNode, createContext, useContext, useState } from "react";
import {
	actionNodeDefaultName,
	triggerNodeDefaultName,
	vectorStoreNodeDefaultName,
} from "../../../utils";
import type {
	AddNodeTool,
	MoveTool,
	SelectEnviromentActionTool,
	SelectFileNodeCategoryTool,
	SelectLanguageModelTool,
	SelectRetrievalCategoryTool,
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

export function addNodeTool(node: Node) {
	return {
		action: "addNode",
		category: "edit",
		node,
	} satisfies AddNodeTool;
}

export function selectRetrievalCategoryTool() {
	return {
		action: "selectRetrievalCategory",
		category: "edit",
	} satisfies SelectRetrievalCategoryTool;
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

export function queryNode(): QueryNode {
	return {
		id: NodeId.generate(),
		type: "operation",
		content: {
			type: "query",
			query: "",
		},
		inputs: [],
		outputs: [
			{
				id: OutputId.generate(),
				label: "Result",
				accessor: "result",
			},
		],
	};
}

export function triggerNode(triggerProvider: TriggerProvider) {
	return {
		id: NodeId.generate(),
		type: "operation",
		name: triggerNodeDefaultName(triggerProvider),
		content: {
			type: "trigger",
			provider: triggerProvider,
			state: {
				status: "unconfigured",
			},
		},
		inputs: [],
		outputs: [],
	} satisfies TriggerNode;
}

export function actionNode(actionProvider: ActionProvider) {
	return {
		id: NodeId.generate(),
		type: "operation",
		name: actionNodeDefaultName(actionProvider),
		content: {
			type: "action",
			command: {
				provider: actionProvider,
				state: {
					status: "unconfigured",
				},
			},
		},
		inputs: [],
		outputs: [],
	} satisfies ActionNode;
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
		type: "operation",
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
	} satisfies ImageGenerationNode;
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

export function vectorStoreNode(
	provider: VectorStoreContent["source"]["provider"],
): VectorStoreNode {
	return {
		id: NodeId.generate(),
		type: "variable",
		name: vectorStoreNodeDefaultName(provider),
		content: {
			type: "vectorStore",
			source: {
				provider: provider,
				state: {
					status: "unconfigured",
				},
			},
		},
		inputs: [],
		outputs: [
			{
				id: OutputId.generate(),
				label: "Output",
				accessor: "source",
			},
		],
	};
}
