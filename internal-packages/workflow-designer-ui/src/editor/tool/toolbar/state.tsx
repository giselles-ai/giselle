"use client";

import type { Node } from "@giselles-ai/protocol";
import { createContext, type ReactNode, useContext, useState } from "react";
import type {
	AddNodeTool,
	MoveTool,
	SelectContextTool,
	SelectFileNodeCategoryTool,
	SelectGitHubTriggerTool,
	SelectIntegrationTool,
	SelectLanguageModelTool,
	SelectLanguageModelV2Tool,
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

export function selectLanguageModelV2Tool() {
	return {
		action: "selectLanguageModelV2",
		category: "edit",
	} satisfies SelectLanguageModelV2Tool;
}

export function addNodeTool(node: Node) {
	return {
		action: "addNode",
		category: "edit",
		node,
	} satisfies AddNodeTool;
}

export function selectContextTool() {
	return {
		action: "selectContext",
		category: "edit",
	} satisfies SelectContextTool;
}

export function selectGithubTriggerTool() {
	return {
		action: "selectGithubTrigger",
		category: "edit",
	} satisfies SelectGitHubTriggerTool;
}

export function selectIntegrationTool() {
	return {
		action: "selectIntegration",
		category: "edit",
	} satisfies SelectIntegrationTool;
}
