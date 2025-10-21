import { PromptEditor } from "@giselle-internal/ui/prompt-editor";
import { Select } from "@giselle-internal/ui/select";
import type { TextGenerationNode } from "@giselle-sdk/data-type";
import { type Node, OutputId } from "@giselle-sdk/data-type";
import {
	useFeatureFlag,
	useWorkflowDesignerStore,
} from "@giselle-sdk/giselle/react";
import {
	type AnthropicLanguageModelData,
	anthropicLanguageModels,
	type GoogleLanguageModelData,
	googleLanguageModels,
	type OpenAILanguageModelData,
	openaiLanguageModels,
} from "@giselle-sdk/language-model";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { AnthropicModelPanel } from "./model/anthropic";
import { GoogleModelPanel } from "./model/google";
import { OpenAIModelPanel } from "./model/openai";
import { createDefaultModelData, updateModelId } from "./model-defaults";
import { useConnectedOutputs } from "./outputs";
import { ToolsPanel } from "./tools/tools-panel";

export function PromptPanel({ node }: { node: TextGenerationNode }) {
	const updateNodeDataContent = useWorkflowDesignerStore(
		(s) => s.updateNodeDataContent,
	);
	const updateNodeData = useWorkflowDesignerStore((s) => s.updateNodeData);
	const deleteConnection = useWorkflowDesignerStore((s) => s.deleteConnection);
	const data = useWorkflowDesignerStore((s) => s.workspace);
	const { all: connectedSources } = useConnectedOutputs(node);
	const { googleUrlContext } = useFeatureFlag();
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

	const providerOptions = [
		{ value: "openai", label: "OpenAI" },
		{ value: "anthropic", label: "Anthropic" },
		{ value: "google", label: "Google" },
	];

	const modelOptions: Array<{ value: string; label: string }> = (() => {
		switch (node.content.llm.provider) {
			case "openai":
				return openaiLanguageModels.map((m) => ({ value: m.id, label: m.id }));
			case "anthropic":
				return anthropicLanguageModels.map((m) => ({
					value: m.id,
					label: m.id,
				}));
			case "google":
				return googleLanguageModels.map((m) => ({ value: m.id, label: m.id }));
			default:
				return [];
		}
	})();

	function handleOpenAIWebSearchChange(enable: boolean) {
		const hasSource = node.outputs.some((o) => o.accessor === "source");
		let nextOutputs = node.outputs;
		if (enable) {
			if (!hasSource) {
				nextOutputs = [
					...node.outputs,
					{ id: OutputId.generate(), label: "Source", accessor: "source" },
				];
			}
		} else if (hasSource) {
			const sourceOutput = node.outputs.find((o) => o.accessor === "source");
			if (sourceOutput) {
				for (const connection of data.connections) {
					if (connection.outputId !== sourceOutput.id) continue;
					deleteConnection(connection.id);
					const connectedNode = data.nodes.find(
						(n) => n.id === connection.inputNode.id,
					);
					if (!connectedNode) continue;
					if (connectedNode.type === "operation") {
						switch (connectedNode.content.type) {
							case "textGeneration":
							case "imageGeneration": {
								updateNodeData(
									connectedNode as unknown as Node,
									{
										inputs: connectedNode.inputs.filter(
											(i) => i.id !== connection.inputId,
										),
									} as Partial<Node>,
								);
								break;
							}
							default:
								break;
						}
					}
				}
			}
			nextOutputs = node.outputs.filter((o) => o.accessor !== "source");
		}
		updateNodeData(
			node as unknown as Node,
			{ outputs: nextOutputs } as Partial<Node>,
		);
	}

	function handleGoogleSearchGroundingChange(enable: boolean) {
		const currentUrlContext =
			node.content.llm.configurations.urlContext ?? false;
		const nextUrlContext = enable ? false : currentUrlContext;
		let outputs = node.outputs;
		const hasSource = node.outputs.some((o) => o.accessor === "source");
		if (enable || nextUrlContext) {
			if (!hasSource)
				outputs = [
					...node.outputs,
					{ id: OutputId.generate(), label: "Source", accessor: "source" },
				];
		} else {
			const sourceOutput = node.outputs.find((o) => o.accessor === "source");
			if (sourceOutput) {
				for (const c of data.connections) {
					if (c.outputId !== sourceOutput.id) continue;
					deleteConnection(c.id);
				}
			}
			outputs = node.outputs.filter((o) => o.accessor !== "source");
		}
		updateNodeData(
			node as unknown as Node,
			{
				content: {
					...node.content,
					llm: {
						...node.content.llm,
						configurations: {
							...node.content.llm.configurations,
							searchGrounding: enable,
							urlContext: nextUrlContext,
						},
					},
				},
				outputs,
			} as Partial<Node>,
		);
	}

	function handleGoogleUrlContextChange(enable: boolean) {
		if (!googleUrlContext) return;
		const currentSearchGrounding =
			node.content.llm.configurations.searchGrounding ?? false;
		const nextSearchGrounding = enable ? false : currentSearchGrounding;
		let outputs = node.outputs;
		const hasSource = node.outputs.some((o) => o.accessor === "source");
		if (enable || nextSearchGrounding) {
			if (!hasSource)
				outputs = [
					...node.outputs,
					{ id: OutputId.generate(), label: "Source", accessor: "source" },
				];
		} else {
			const sourceOutput = node.outputs.find((o) => o.accessor === "source");
			if (sourceOutput) {
				for (const c of data.connections) {
					if (c.outputId !== sourceOutput.id) continue;
					deleteConnection(c.id);
				}
			}
			outputs = node.outputs.filter((o) => o.accessor !== "source");
		}
		updateNodeData(
			node as unknown as Node,
			{
				content: {
					...node.content,
					llm: {
						...node.content.llm,
						configurations: {
							...node.content.llm.configurations,
							searchGrounding: nextSearchGrounding,
							urlContext: enable,
						},
					},
				},
				outputs,
			} as Partial<Node>,
		);
	}

	const header = (
		<div className="grid grid-cols-2 gap-[8px]">
			<fieldset className="flex flex-col min-w-0">
				<label htmlFor="provider" className="text-text text-[12px] mb-[2px]">
					Provider
				</label>
				<Select
					id="provider"
					placeholder="Select a provider"
					value={node.content.llm.provider}
					onValueChange={(provider) => {
						const valid = provider as "openai" | "anthropic" | "google";
						const next = createDefaultModelData(valid);
						updateNodeDataContent(node, { llm: next, tools: {} });
					}}
					options={providerOptions}
					widthClassName="w-full"
				/>
			</fieldset>
			<fieldset className="flex flex-col min-w-0">
				<label htmlFor="model" className="text-text text-[12px] mb-[2px]">
					Model
				</label>
				<Select
					id="model"
					placeholder="Select a model"
					value={node.content.llm.id}
					widthClassName="w-full"
					onValueChange={(modelId) => {
						const updated = updateModelId(node.content.llm, modelId);
						updateNodeDataContent(node, { llm: updated });
					}}
					options={modelOptions}
				/>
			</fieldset>
			<div className="col-span-2 flex flex-col gap-[12px]">
				{node.content.llm.provider === "openai" && (
					<OpenAIModelPanel
						openaiLanguageModel={node.content.llm as OpenAILanguageModelData}
						tools={node.content.tools}
						onModelChange={(value) =>
							updateNodeDataContent(node, { llm: value })
						}
						onToolChange={(changedTool) =>
							updateNodeDataContent(node, { tools: changedTool })
						}
						onWebSearchChange={handleOpenAIWebSearchChange}
					/>
				)}
				{node.content.llm.provider === "google" && (
					<GoogleModelPanel
						googleLanguageModel={node.content.llm as GoogleLanguageModelData}
						onSearchGroundingConfigurationChange={
							handleGoogleSearchGroundingChange
						}
						onUrlContextConfigurationChange={handleGoogleUrlContextChange}
						onModelChange={(value) =>
							updateNodeDataContent(node, { llm: value })
						}
					/>
				)}
				{node.content.llm.provider === "anthropic" && (
					<AnthropicModelPanel
						anthropicLanguageModel={
							node.content.llm as AnthropicLanguageModelData
						}
						onModelChange={(value) =>
							updateNodeDataContent(node, { llm: value })
						}
					/>
				)}
			</div>
			<div className="col-span-2">
				<button
					type="button"
					onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
					className="flex items-center gap-[8px] w-full text-left text-[14px] text-inverse hover:text-primary-900 transition-colors"
				>
					<ChevronRightIcon
						className={`size-[16px] transition-transform ${isAdvancedOpen ? "rotate-90" : ""}`}
					/>
					<span>Advanced options</span>
				</button>
				{isAdvancedOpen && (
					<div className="mt-[12px]">
						<ToolsPanel node={node} />
					</div>
				)}
			</div>
			<div className="col-span-2 text-text text-[12px]">Prompt</div>
		</div>
	);

	return (
		<PromptEditor
			key={JSON.stringify(connectedSources.map((c) => c.node.id))}
			placeholder="Write your prompt here..."
			value={node.content.prompt}
			onValueChange={(value) => {
				updateNodeDataContent(node, { prompt: value });
			}}
			nodes={connectedSources.map((source) => source.node)}
			connectedSources={connectedSources.map(
				({ node: n, id, label, accessor }) => ({
					node: n,
					output: { id, label, accessor },
				}),
			)}
			showToolbar={false}
			variant="plain"
			header={header}
		/>
	);
}
