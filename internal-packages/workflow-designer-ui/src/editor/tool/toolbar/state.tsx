"use client";

import {
	type ActionNode,
	type FileCategory,
	type FileNode,
	type GitHubActionProvider,
	type GitHubTriggerProvider,
	type ImageGenerationLanguageModelData,
	type ImageGenerationNode,
	type Input,
	InputId,
	type ManualTriggerProvider,
	type Node,
	NodeId,
	type Output,
	OutputId,
	type TextGenerationLanguageModelData,
	type TextGenerationNode,
	type TextNode,
	type TriggerNode,
	type TriggerProvider,
	type TriggerProviderLike,
} from "@giselle-sdk/data-type";
import { actions, githubTriggers, triggers } from "@giselle-sdk/flow";
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

export function triggerNode(triggerId: string) {
	const trigger = triggers.find((trigger) => trigger.id === triggerId);
	if (trigger === undefined) {
		throw new Error("Unsupported trigger");
	}

	const outputs: Output[] = [];
	if ("payloads" in trigger)
		for (const payloadKey of trigger.payloads.keyof()
			.options as Array<string>) {
			outputs.push({
				id: OutputId.generate(),
				label: payloadKey,
				accessor: payloadKey,
			});
		}

	function createDefaultProvider(trigger: (typeof triggers)[number]) {
		switch (trigger.provider) {
			case "github":
				return {
					type: "github",
					triggerId,
					auth: {
						state: "unauthenticated",
					},
				} satisfies GitHubTriggerProvider;
			case "manual":
				return { type: "manual", triggerId } satisfies ManualTriggerProvider;
			default: {
				const _exhaustiveCheck: never = trigger;
				throw new Error(`Unsupported trigger provider: ${_exhaustiveCheck}`);
			}
		}
	}

	return {
		id: NodeId.generate(),
		type: "operation",
		name: trigger.label,
		content: {
			type: "trigger",
			provider: createDefaultProvider(trigger),
		},
		inputs: [],
		outputs,
	} satisfies TriggerNode;
}

export function actionNode(actionId: string) {
	const action = actions.find((action) => action.id === actionId);
	if (!action) {
		throw new Error(`Action not found: ${actionId}`);
	}

	const inputs: Input[] = [];
	if ("parameters" in action)
		for (const payloadKey of action.parameters.keyof()
			.options as Array<string>) {
			inputs.push({
				id: InputId.generate(),
				label: payloadKey,
			});
		}

	function createDefaultProvider(action: (typeof actions)[number]) {
		switch (action.provider) {
			case "github":
				return {
					type: "github",
					actionId,
					auth: {
						state: "unauthenticated",
					},
				} satisfies GitHubActionProvider;
			default: {
				const _exhaustiveCheck: never = action.provider;
				throw new Error(`Unsupported trigger provider: ${_exhaustiveCheck}`);
			}
		}
	}
	return {
		id: NodeId.generate(),
		type: "operation",
		name: action.label,
		content: {
			type: "action",
			provider: createDefaultProvider(action),
		},
		inputs,
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
