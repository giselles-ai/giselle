"use client";

import type {
	FileCategory,
	TextGenerationLanguageModelData,
} from "@giselle-sdk/data-type";
import { type ReactNode, createContext, useContext, useState } from "react";
import type {
	AddFileNodeTool,
	AddGitHubNodeTool,
	AddTextGenerationNodeTool,
	AddTextNodeTool,
	MoveTool,
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

export function addTextNodeTool() {
	return {
		action: "addTextNode",
		category: "edit",
	} satisfies AddTextNodeTool;
}

export function addGitHubNodeTool() {
	return {
		action: "addGitHubNode",
		category: "edit",
	} satisfies AddGitHubNodeTool;
}
