import { PromptEditor } from "@giselle-internal/ui/prompt-editor";
import { SettingLabel } from "@giselle-internal/ui/setting-label";
import { useToasts } from "@giselle-internal/ui/toast";
import type {
	ImageGenerationLanguageModelData,
	ImageGenerationNode,
} from "@giselle-sdk/data-type";
import {
	isSupportedConnection,
	useNodeGenerations,
	useWorkflowDesigner,
	useWorkflowDesignerStore,
} from "@giselle-sdk/giselle/react";
import {
	falLanguageModels,
	googleImageLanguageModels,
	openaiImageModels,
} from "@giselle-sdk/language-model";
import { Minimize2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { useModelEligibility } from "../../lib/use-model-eligibility";
import { isPromptEmpty } from "../../lib/validate-prompt";
import { PropertiesPanelContent, PropertiesPanelRoot } from "../ui";
import { GenerateCtaButton } from "../ui/generate-cta-button";
import { NodePanelHeader } from "../ui/node-panel-header";
import { GenerationPanel } from "./generation-panel";
import { PromptPanel } from "./prompt-panel";
import { useConnectedSources } from "./sources";

export function ImageGenerationNodePropertiesPanel({
	node,
}: {
	node: ImageGenerationNode;
}) {
	const {
		data,
		updateNodeDataContent,
		updateNodeData,
		deleteConnection,
		deleteNode,
	} = useWorkflowDesigner();
	const { createAndStartGenerationRunner, isGenerating, stopGenerationRunner } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "studio", workspaceId: data.id },
		});
	const { all: connectedSources } = useConnectedSources(node);
	const usageLimitsReached = useUsageLimitsReached();
	const { error } = useToasts();

	const checkEligibility = useModelEligibility();

	const [isPromptExpanded, setIsPromptExpanded] = useState(false);
	const [isGenerationExpanded, setIsGenerationExpanded] = useState(false);
	const [editorVersion, setEditorVersion] = useState(0);
	const generateCtaRef = useRef<HTMLDivElement | null>(null);
	const [_overlayBottomPx, setOverlayBottomPx] = useState(0);
	const promptEditorRef = useRef<HTMLDivElement | null>(null);
	const generationPanelRef = useRef<HTMLDivElement | null>(null);
	const [promptTopPx, setPromptTopPx] = useState(0);
	const [generationTopPx, setGenerationTopPx] = useState(0);

	const _uiState = useMemo(() => data.ui.nodeState[node.id], [data, node.id]);

	// Subscribe live to the latest prompt (for expanded editor sync)
	const livePrompt = useWorkflowDesignerStore((s) => {
		const n = s.workspace.nodes.find((x) => x.id === node.id);
		return (n?.content as { prompt?: string } | undefined)?.prompt;
	});

	// Get available models for current provider
	const _models = useMemo(() => {
		switch (node.content.llm.provider) {
			case "fal":
				return falLanguageModels.map((model) => ({
					value: model.id,
					label: model.id,
					disabled: !checkEligibility(model),
				}));
			case "openai":
				return openaiImageModels.map((model) => ({
					value: model.id,
					label: model.id,
					disabled: !checkEligibility(model),
				}));
			case "google":
				return googleImageLanguageModels.map((model) => ({
					value: model.id,
					label: model.id,
					disabled: !checkEligibility(model),
				}));
			default: {
				const _exhaustiveCheck: never = node.content.llm;
				throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
			}
		}
	}, [node.content.llm, checkEligibility]);

	const _disconnectInvalidConnections = useCallback(
		(model: ImageGenerationLanguageModelData) => {
			const connections = data.connections.filter(
				(c) => c.inputNode.id === node.id,
			);
			if (connections.length === 0) return;

			const newInputNode = {
				...node,
				content: { ...node.content, llm: model },
			};
			for (const connection of connections) {
				const outputNode = data.nodes.find(
					(n) => n.id === connection.outputNode.id,
				);
				if (!outputNode) continue;

				if (!isSupportedConnection(outputNode, newInputNode).canConnect) {
					deleteConnection(connection.id);
				}
			}
		},
		[node, data.connections, data.nodes, deleteConnection],
	);

	useKeyboardShortcuts({
		onGenerate: () => {
			if (!isGenerating) {
				generateImage();
			}
		},
	});

	const generateImage = useCallback(() => {
		if (usageLimitsReached) {
			error("Please upgrade your plan to continue using this feature.");
			return;
		}
		if (isPromptEmpty(node.content.prompt)) {
			error("Please fill in the prompt to run.");
			return;
		}

		createAndStartGenerationRunner({
			origin: {
				type: "studio",
				workspaceId: data.id,
			},
			operationNode: node,
			sourceNodes: connectedSources.map(
				(connectedSource) => connectedSource.node,
			),
			connections: data.connections.filter(
				(connection) => connection.inputNode.id === node.id,
			),
		});
	}, [
		connectedSources,
		data.id,
		data.connections,
		node,
		createAndStartGenerationRunner,
		usageLimitsReached,
		error,
	]);

	useEffect(() => {
		const el = generateCtaRef.current;
		if (!el) {
			setOverlayBottomPx(0);
			return;
		}
		const update = () => setOverlayBottomPx(el.offsetHeight || 0);
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		window.addEventListener("resize", update);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", update);
		};
	}, []);

	useEffect(() => {
		const el = promptEditorRef.current;
		if (!el) {
			setPromptTopPx(0);
			return;
		}
		const update = () => {
			const rect = el.getBoundingClientRect();
			const container = el.closest(".relative");
			const containerRect = container?.getBoundingClientRect();
			setPromptTopPx(containerRect ? rect.top - containerRect.top : 0);
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		window.addEventListener("resize", update);
		window.addEventListener("scroll", update, true);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", update);
			window.removeEventListener("scroll", update, true);
		};
	}, []);

	useEffect(() => {
		const el = generationPanelRef.current;
		if (!el) {
			setGenerationTopPx(0);
			return;
		}
		const update = () => {
			const rect = el.getBoundingClientRect();
			const container = el.closest(".relative");
			const containerRect = container?.getBoundingClientRect();
			setGenerationTopPx(containerRect ? rect.top - containerRect.top : 0);
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		window.addEventListener("resize", update);
		window.addEventListener("scroll", update, true);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", update);
			window.removeEventListener("scroll", update, true);
		};
	}, []);

	return (
		<PropertiesPanelRoot>
			{usageLimitsReached && <UsageLimitWarning />}
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/image-node"
				onDelete={() => deleteNode(node.id)}
			/>

			<PropertiesPanelContent>
				<div className="relative flex-1 min-h-0 flex flex-col">
					<div className="flex-1 min-h-0 overflow-y-auto">
						<div ref={promptEditorRef} className="mt-[12px]">
							<PromptPanel
								node={node}
								onExpand={() => {
									setEditorVersion((v) => v + 1);
									requestAnimationFrame(() => setIsPromptExpanded(true));
								}}
								editorVersion={editorVersion}
							/>
						</div>

						<div className="mt-[8px]" ref={generationPanelRef}>
							<SettingLabel className="mb-[4px]">Output</SettingLabel>
							<GenerationPanel
								node={node}
								onClickGenerateButton={generateImage}
								onExpand={() => setIsGenerationExpanded(true)}
							/>
						</div>
					</div>

					<div
						ref={generateCtaRef}
						className="shrink-0 px-[16px] pt-[8px] pb-[4px] bg-gradient-to-t from-background via-background/80 to-transparent"
					>
						<GenerateCtaButton
							isGenerating={isGenerating}
							isEmpty={isPromptEmpty(node.content.prompt)}
							onClick={() => {
								if (isGenerating) stopGenerationRunner();
								else generateImage();
							}}
						/>
					</div>

					{/* Expanded prompt overlay */}
					<div
						role="dialog"
						aria-modal="true"
						aria-label="Expanded prompt editor"
						className={`absolute left-0 right-0 z-20 flex flex-col bg-background rounded-[8px] transition-all duration-300 ease-out ${
							isPromptExpanded
								? "opacity-100 scale-y-100 pointer-events-auto"
								: "opacity-0 scale-y-0 pointer-events-none"
						}`}
						style={{
							top: 0,
							bottom: _overlayBottomPx,
							paddingBottom: 12,
							transformOrigin: `center ${promptTopPx}px`,
						}}
					>
						<div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-[8px] bg-background">
							<PromptEditor
								key={`expanded-${editorVersion}-${node.id}`}
								value={livePrompt ?? node.content.prompt}
								onValueChange={(value) => {
									updateNodeDataContent(node, { prompt: value });
								}}
								connectedSources={connectedSources.map(({ node, output }) => ({
									node,
									output,
								}))}
								placeholder="Write your prompt here..."
								showToolbar={false}
								variant="plain"
								showExpandIcon={false}
								containerClassName="flex-1 min-h-0"
								editorClassName="min-h-0 h-full"
							/>
						</div>
						<div className="absolute bottom-[20px] right-[12px]">
							<button
								type="button"
								aria-label="Minimize prompt editor"
								className="size-[32px] rounded-full bg-inverse hover:bg-inverse/80 transition-colors flex items-center justify-center"
								onClick={() => {
									setIsPromptExpanded(false);
									setEditorVersion((v) => v + 1);
								}}
							>
								<Minimize2 className="size-[16px] text-background" />
							</button>
						</div>
						<button
							type="button"
							aria-label="Backdrop"
							className="absolute inset-0 -z-10"
							onClick={() => {
								setIsPromptExpanded(false);
								setEditorVersion((v) => v + 1);
							}}
						/>
					</div>

					{/* Expanded generation overlay */}
					<div
						role="dialog"
						aria-modal="true"
						aria-label="Expanded generation panel"
						className={`absolute left-0 right-0 z-20 flex flex-col bg-background rounded-[8px] transition-all duration-300 ease-out ${
							isGenerationExpanded
								? "opacity-100 scale-y-100 pointer-events-auto"
								: "opacity-0 scale-y-0 pointer-events-none"
						}`}
						style={{
							top: 0,
							bottom: _overlayBottomPx,
							paddingBottom: 12,
							transformOrigin: `center ${generationTopPx}px`,
						}}
					>
						<GenerationPanel
							node={node}
							onClickGenerateButton={generateImage}
							isExpanded={true}
						/>
						<div className="absolute bottom-[20px] right-[12px]">
							<button
								type="button"
								aria-label="Minimize generation panel"
								className="size-[32px] rounded-full bg-inverse hover:bg-inverse/80 transition-colors flex items-center justify-center"
								onClick={() => setIsGenerationExpanded(false)}
							>
								<Minimize2 className="size-[16px] text-background" />
							</button>
						</div>
						<button
							type="button"
							aria-label="Backdrop"
							className="absolute inset-0 -z-10"
							onClick={() => setIsGenerationExpanded(false)}
						/>
					</div>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
