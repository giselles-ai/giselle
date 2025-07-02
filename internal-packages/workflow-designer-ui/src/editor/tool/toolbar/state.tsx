"use client";

import type { Node, VectorStoreContent } from "@giselle-sdk/data-type";
import { nodeFactories } from "@giselle-sdk/giselle-engine/react";
import { createContext, type ReactNode, useContext, useState } from "react";
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

export function ToolbarContextProvider({ children }: { children: ReactNode }) {
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
) {
	return nodeFactories.create("vectorStore", provider);
}

export function webPageNode() {
	return nodeFactories.create("webPage");
}
