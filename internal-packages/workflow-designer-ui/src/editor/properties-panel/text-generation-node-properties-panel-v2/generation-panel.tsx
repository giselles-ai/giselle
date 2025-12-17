import type {
	CompletedGeneration,
	FailedGeneration,
	Generation,
} from "@giselles-ai/protocol";
import {
	isTextGenerationNode,
	type TextGenerationNode,
} from "@giselles-ai/protocol";
import { useNodeGenerations } from "@giselles-ai/react";
import clsx from "clsx/lite";
import { ArrowDownIcon, ArrowUpIcon, TimerIcon } from "lucide-react";
import { useAppDesignerStore } from "../../../app-designer";
import { TextGenerationIcon } from "../../../icons";
import ClipboardButton from "../../../ui/clipboard-button";
import { EmptyState } from "../../../ui/empty-state";
import { GenerationView } from "../../../ui/generation-view";

function Empty() {
	return (
		<div className="relative bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] rounded-[8px] flex justify-center items-center text-text-muted py-[24px]">
			<EmptyState
				icon={<TextGenerationIcon width={24} height={24} />}
				title="Nothing generated yet."
				description="Generate or adjust the Prompt to see results."
				className="text-text-muted"
			/>
		</div>
	);
}

// Helper function to format execution time
function formatExecutionTime(startedAt: number, completedAt: number): string {
	const durationMs = completedAt - startedAt;
	if (durationMs < 60000) {
		return `${durationMs.toLocaleString()}ms`;
	}
	const minutes = Math.floor(durationMs / 60000);
	const seconds = Math.floor((durationMs % 60000) / 1000);
	return `${minutes}m ${seconds}s`;
}

// Helper function to extract text content from a generation
function getGenerationTextContent(generation: Generation): string {
	// For completed generations, use the outputs field
	if (generation.status === "completed") {
		const completedGeneration = generation as CompletedGeneration;
		// Find all text outputs
		const textOutputs = completedGeneration.outputs
			.filter((output) => output.type === "generated-text")
			.map((output) => (output.type === "generated-text" ? output.content : ""))
			.join("\n\n");

		if (textOutputs) {
			return textOutputs;
		}
	}

	// Fallback to extracting from messages if no outputs or not completed
	const generatedMessages =
		"messages" in generation
			? (generation.messages?.filter((m) => m.role === "assistant") ?? [])
			: [];

	return generatedMessages
		.map((message) =>
			message.parts
				?.filter((part) => part.type === "text")
				.map((part) => (part.type === "text" ? part.text : ""))
				.join("\n"),
		)
		.join("\n");
}

// Helper function to extract error content from a failed generation
function getGenerationErrorContent(generation: Generation): string {
	if (generation.status === "failed") {
		const failedGeneration = generation as FailedGeneration;
		const error = failedGeneration.error;
		return `${error.name}: ${error.message}`;
	}

	return "";
}

// Helper function to get LLM provider display name
function getProviderDisplayName(provider: string): string {
	switch (provider) {
		case "openai":
			return "OpenAI";
		case "anthropic":
			return "Anthropic";
		case "google":
			return "Google";
		default:
			return provider;
	}
}

// Helper function to get model info from generation context
function getGenerationModelInfo(generation: Generation): {
	provider: string;
	modelId: string;
} {
	if (isTextGenerationNode(generation.context.operationNode)) {
		const content = generation.context.operationNode.content;
		return {
			provider: content.llm?.provider || "Unknown",
			modelId: content.llm?.id || "",
		};
	}
	return { provider: "Unknown", modelId: "" };
}

export function GenerationPanel({
	textGenerationNode,
}: {
	textGenerationNode: TextGenerationNode;
}) {
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const { currentGeneration } = useNodeGenerations({
		nodeId: textGenerationNode.id,
		origin: { type: "studio", workspaceId },
	});

	if (currentGeneration === undefined) {
		return <Empty />;
	}
	return (
		<div
			className={
				"relative flex flex-col bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] rounded-[8px] py-[8px]"
			}
		>
			<div
				className={clsx(
					"border-b border-white-400/20 py-[4px] px-[16px] flex items-center gap-[8px]",
					"**:data-header-text:font-[700]",
				)}
			>
				<div className="flex-1 flex items-center gap-[8px]">
					{(currentGeneration.status === "created" ||
						currentGeneration.status === "queued" ||
						currentGeneration.status === "running") && (
						<p data-header-text>Generating...</p>
					)}
					{currentGeneration.status === "completed" && (
						<p data-header-text>Result</p>
					)}
					{currentGeneration.status === "failed" && (
						<p data-header-text>Error</p>
					)}
					{currentGeneration.status === "cancelled" && (
						<p data-header-text>
							Result{" "}
							<span className="text-[12px] font-normal">
								from {(() => {
									const modelInfo = getGenerationModelInfo(currentGeneration);
									return `${getProviderDisplayName(modelInfo.provider)} ${modelInfo.modelId}`;
								})()}
							</span>
						</p>
					)}
					{currentGeneration.status === "completed" &&
						currentGeneration.usage && (
							<div className="flex items-center gap-[10px] text-[11px] text-text-muted font-sans ml-[6px]">
								{currentGeneration.startedAt &&
									currentGeneration.completedAt && (
										<span className="flex items-center gap-[2px]">
											<TimerIcon className="text-text-muted size-[12px]" />
											{formatExecutionTime(
												currentGeneration.startedAt,
												currentGeneration.completedAt,
											)}
										</span>
									)}

								{currentGeneration.usage.inputTokens && (
									<span className="flex items-center gap-[2px]">
										<ArrowUpIcon className="text-text-muted size-[12px]" />
										{currentGeneration.usage.inputTokens.toLocaleString()}t
									</span>
								)}
								{currentGeneration.usage.outputTokens && (
									<span className="flex items-center gap-[2px]">
										<ArrowDownIcon className="text-text-muted size-[12px]" />
										{currentGeneration.usage.outputTokens.toLocaleString()}t
									</span>
								)}
							</div>
						)}
				</div>
				{(currentGeneration.status === "completed" ||
					currentGeneration.status === "cancelled") && (
					<ClipboardButton
						text={getGenerationTextContent(currentGeneration)}
						tooltip="Copy to clipboard"
						className="text-text-muted hover:text-text/60"
					/>
				)}
				{currentGeneration.status === "failed" && (
					<ClipboardButton
						text={getGenerationErrorContent(currentGeneration)}
						tooltip="Copy error to clipboard"
						className="text-text-muted hover:text-text/60"
					/>
				)}
			</div>
			<div className="flex-1 py-[4px] px-[16px] overflow-y-auto">
				<GenerationView generation={currentGeneration} />
			</div>
		</div>
	);
}
