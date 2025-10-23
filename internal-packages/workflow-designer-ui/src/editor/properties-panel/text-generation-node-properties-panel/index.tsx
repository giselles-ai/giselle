import { IconBox } from "@giselle-internal/ui/icon-box";
import { PromptEditor } from "@giselle-internal/ui/prompt-editor";
import { SettingLabel } from "@giselle-internal/ui/setting-label";
import { useToasts } from "@giselle-internal/ui/toast";
import type { TextGenerationNode } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
	useWorkflowDesignerStore,
} from "@giselle-sdk/giselle/react";
import { Minimize2, Trash2 as TrashIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUsageLimitsReached } from "../../../hooks/usage-limits";
import { UsageLimitWarning } from "../../../ui/usage-limit-warning";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { isPromptEmpty } from "../../lib/validate-prompt";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { GenerationPanel } from "./generation-panel";
import { useConnectedOutputs } from "./outputs";
import { TextGenerationTabContent } from "./tab-content";

export function TextGenerationNodePropertiesPanel({
	node,
}: {
	node: TextGenerationNode;
}) {
	const { data, updateNodeData, deleteNode } = useWorkflowDesigner();
	const captureOpts: AddEventListenerOptions = { capture: true };
	const updateNodeDataContent = useWorkflowDesignerStore(
		(s) => s.updateNodeDataContent,
	);
	const {
		createAndStartGenerationRunner,
		isGenerating,
		stopGenerationRunner,
		currentGeneration,
	} = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "studio", workspaceId: data.id },
	});
	const { all: connectedSources } = useConnectedOutputs(node);
	const [isPromptExpanded, setIsPromptExpanded] = useState(false);
	const [isGenerationExpanded, setIsGenerationExpanded] = useState(false);
	const [editorVersion, setEditorVersion] = useState(0);
	const generateCtaRef = useRef<HTMLDivElement | null>(null);
	const [_overlayBottomPx, setOverlayBottomPx] = useState(0);
	const promptEditorRef = useRef<HTMLDivElement | null>(null);
	const generationPanelRef = useRef<HTMLDivElement | null>(null);
	const [promptTopPx, setPromptTopPx] = useState(0);
	const [generationTopPx, setGenerationTopPx] = useState(0);
	const usageLimitsReached = useUsageLimitsReached();
	const { error } = useToasts();

	useKeyboardShortcuts({
		onGenerate: () => {
			if (!isGenerating) {
				generateText();
			}
		},
	});

	const generateText = useCallback(() => {
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
		const onKeydown = (e: KeyboardEvent) => {
			if (isPromptExpanded && e.key === "Escape") {
				e.stopPropagation();
				setIsPromptExpanded(false);
				setEditorVersion((v) => v + 1);
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				generateText();
			}
		};
		window.addEventListener("keydown", onKeydown, captureOpts);
		return () => window.removeEventListener("keydown", onKeydown, captureOpts);
	}, [isPromptExpanded, generateText]);

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
			<PropertiesPanelHeader
				node={node}
				description={node.content.llm.provider}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				action={
					<div className="flex items-center gap-[6px]">
						<IconBox
							aria-label="Open documentation"
							title="Open documentation"
							onClick={() =>
								window.open(
									"https://docs.giselles.ai",
									"_blank",
									"noopener,noreferrer",
								)
							}
						>
							<svg
								className="size-[14px]"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								role="img"
								aria-label="External link"
							>
								<path
									d="M14 3h7v7m0-7L10 14"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</IconBox>
						<IconBox
							aria-label="Delete node"
							title="Delete node"
							onClick={() => deleteNode(node.id)}
						>
							<TrashIcon className="size-[14px]" />
						</IconBox>
					</div>
				}
			/>

			<PropertiesPanelContent>
				<div className="relative flex-1 min-h-0 flex flex-col">
					<div className="flex-1 min-h-0 overflow-y-auto">
						<div ref={promptEditorRef}>
							<TextGenerationTabContent
								node={node}
								onPromptExpand={() => {
									setIsPromptExpanded(true);
								}}
								editorVersion={editorVersion}
							/>
						</div>
						<div className="mt-[8px]">
							<SettingLabel className="mb-[4px]">Output</SettingLabel>
							<div ref={generationPanelRef}>
								<GenerationPanel
									node={node}
									onClickGenerateButton={generateText}
									onExpand={() => {
										setIsGenerationExpanded(true);
									}}
								/>
							</div>
						</div>
					</div>
					<div
						ref={generateCtaRef}
						className="shrink-0 px-[16px] pt-[8px] pb-[4px] bg-gradient-to-t from-bg via-bg/80 to-transparent"
					>
						<button
							type="button"
							onClick={() => {
								if (isGenerating) {
									stopGenerationRunner();
								} else {
									generateText();
								}
							}}
							disabled={!isGenerating && isPromptEmpty(node.content.prompt)}
							className={`w-full flex items-center justify-center px-[24px] py-[12px] text-white rounded-[9999px] border transition-all hover:translate-y-[-1px] cursor-pointer font-sans font-[500] text-[14px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
								!isPromptEmpty(node.content.prompt)
									? "bg-primary-900 border-primary-900/30 hover:bg-primary-800"
									: "bg-[#141519] border-border/15 hover:bg-[#1e1f26] hover:border-border/25"
							}`}
						>
							<span
								className={`mr-[8px] generate-star ${isGenerating ? "generating" : ""}`}
							>
								✦
							</span>
							{isGenerating ? "Stop" : "Generate with the Current Prompt"}
							{!isGenerating && (
								<span className="ml-[8px] flex items-center gap-[2px] text-[11px] text-white/60">
									<kbd className="px-[4px] py-[1px] bg-white/20 rounded-[4px]">
										⌘
									</kbd>
									<kbd className="px-[4px] py-[1px] bg-white/20 rounded-[4px]">
										↵
									</kbd>
								</span>
							)}
							<style jsx>{`
								.generate-star { display: inline-block; }
								.generate-star.generating { animation: continuousRotate 1s linear infinite; }
								button:hover .generate-star:not(.generating) { animation: rotateStar 0.7s ease-in-out; }
								@keyframes rotateStar {
									0% { transform: rotate(0deg) scale(1); }
									50% { transform: rotate(180deg) scale(1.5); }
									100% { transform: rotate(360deg) scale(1); }
								}
								@keyframes continuousRotate {
									0% { transform: rotate(0deg); }
									100% { transform: rotate(360deg); }
								}
							`}</style>
						</button>
					</div>
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
							bottom: 0,
							transformOrigin: `center ${promptTopPx}px`,
						}}
					>
						<PromptEditor
							value={node.content.prompt}
							onValueChange={(value) => {
								updateNodeDataContent(node, { prompt: value });
							}}
							nodes={connectedSources.map((s) => s.node)}
							connectedSources={connectedSources.map(
								({ node: n, id, label, accessor }) => ({
									node: n,
									output: { id, label, accessor },
								}),
							)}
							placeholder="Write your prompt here..."
							showToolbar={false}
							variant="plain"
							showExpandIcon={false}
							containerClassName="flex-1 min-h-0"
							editorClassName="min-h-0 h-full"
						/>
						<div className="absolute bottom-[12px] right-[12px]">
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
							bottom: 0,
							transformOrigin: `center ${generationTopPx}px`,
						}}
					>
						{currentGeneration && (
							<GenerationPanel
								node={node}
								onClickGenerateButton={generateText}
								isExpanded={true}
							/>
						)}
						<div className="absolute bottom-[12px] right-[12px]">
							<button
								type="button"
								aria-label="Minimize generation panel"
								className="size-[32px] rounded-full bg-inverse hover:bg-inverse/80 transition-colors flex items-center justify-center"
								onClick={() => {
									setIsGenerationExpanded(false);
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
								setIsGenerationExpanded(false);
							}}
						/>
					</div>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
