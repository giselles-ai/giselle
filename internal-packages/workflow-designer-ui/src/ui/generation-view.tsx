"use client";

import type { Generation } from "@giselles-ai/giselle";
import { useGiselleEngine } from "@giselles-ai/giselle/react";
import type { UIMessage } from "ai";
import { ChevronRightIcon } from "lucide-react";
import { Accordion } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import { WilliIcon } from "../icons";
import { THUMB_HEIGHT } from "./constants";
import { ImageCard } from "./image-card";
import { ImageGenerationLoading } from "./image-generation-loading";
import { Lightbox } from "./lightbox";

import { MemoizedMarkdown } from "./memoized-markdown";

function mergeAdjacentTextParts<T extends UIMessage>({ parts, ...message }: T) {
	const merged: T["parts"] = [];
	let buffer = "";

	for (const part of parts) {
		if (part.type === "text") {
			buffer += part.text;
			continue;
		}
		// Flush any buffered text before pushing a non-text part
		if (buffer.length > 0) {
			merged.push({ type: "text", text: buffer });
			buffer = "";
		}
		merged.push(part);
	}

	// Flush tail buffer
	if (buffer.length > 0) {
		merged.push({ type: "text", text: buffer });
	}

	return {
		...message,
		parts: merged,
	};
}

function Spinner() {
	return (
		<div className="flex gap-[12px] text-text-muted">
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-1" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-2" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-3" />
		</div>
	);
}

function _renderImageLoadingGrid(generation: Generation, keyPrefix: string) {
	const isImageGeneration =
		generation.context.operationNode.content.type === "imageGeneration";

	if (
		!isImageGeneration ||
		!("llm" in generation.context.operationNode.content)
	) {
		return null;
	}

	const config = generation.context.operationNode.content
		.llm as import("@giselles-ai/protocol").ImageGenerationLanguageModelData;
	let imageCount = 1;
	if (config.provider !== "google") {
		imageCount = config.configurations.n;
	}
	return (
		<div className="flex gap-[12px] pt-[8px] overflow-x-auto max-w-full h-full">
			{Array.from({ length: imageCount }).map((_, index) => (
				<div
					key={`${generation.id}-${keyPrefix}-${index}`}
					className="flex-shrink-0 bg-inverse/10 rounded-[8px] overflow-hidden flex items-center justify-center h-full"
				>
					<ImageGenerationLoading configuration={config} />
				</div>
			))}
		</div>
	);
}
export function GenerationView({ generation }: { generation: Generation }) {
	const client = useGiselleEngine();
	const [lightboxImage, setLightboxImage] = useState<string | null>(null);

	// Handle ESC key to close lightbox
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && lightboxImage) {
				setLightboxImage(null);
			}
		};

		if (lightboxImage) {
			document.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [lightboxImage]);

	const generatedMessages = useMemo(() => {
		if ("messages" in generation && generation.messages !== undefined) {
			return generation.messages
				.filter((m) => m.role === "assistant")
				.map((message) => mergeAdjacentTextParts(message));
		}
		return [];
	}, [generation]);

	if (generation.status === "failed") {
		return (
			<div>
				<p>{generation.error.message}</p>
				<p>id: {generation.id}</p>
			</div>
		);
	}

	if (
		generation.status !== "running" &&
		generation.status !== "completed" &&
		generation.status !== "cancelled"
	) {
		return (
			<div className="pt-[8px]">
				<Spinner />
			</div>
		);
	}
	// While running, show spinner (main branch behavior) instead of per-image placeholders
	if (generation.status === "running") {
		return (
			<div className="pt-[8px]">
				<Spinner />
			</div>
		);
	}

	return (
		<>
			{generation.status === "completed" &&
				generation.outputs.map((output) => {
					if (output.type !== "generated-image") {
						return null;
					}
					return (
						<div
							key={output.outputId}
							className="flex gap-[12px] pt-[8px] overflow-x-auto max-w-full"
							style={{ height: `${THUMB_HEIGHT.sm}px` }}
						>
							{output.contents.map((content) => (
								<ImageCard
									key={content.filename}
									src={`${client.basePath}${content.pathname}`}
									onDownload={() => {
										const link = document.createElement("a");
										link.href = `${client.basePath}${content.pathname}`;
										link.download = content.filename;
										link.click();
									}}
									onZoom={() =>
										setLightboxImage(`${client.basePath}${content.pathname}`)
									}
								/>
							))}
						</div>
					);
				})}
			{generatedMessages.map((message) => (
				<div key={message.id}>
					{message.parts.map((part, index) => {
						const lastPart = message.parts.length === index + 1;
						switch (part.type) {
							case "reasoning":
								if (lastPart) {
									return (
										<Accordion.Root
											key={`messages.${message.id}.parts.[${index}].reasoning`}
											type="single"
											collapsible
											className="my-[8px]"
											defaultValue={`messages.${message.id}.parts.[${index}].reasoning`}
										>
											<Accordion.Item
												value={`messages.${message.id}.parts.[${index}].reasoning`}
											>
												<Accordion.Trigger className="group text-inverse text-[12px] flex items-center gap-[4px] cursor-pointer hover:text-inverse transition-colors data-[state=open]:text-inverse outline-none font-sans">
													<ChevronRightIcon
														className="size-[16px] transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-90"
														aria-hidden
													/>
													<span className="bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-[rgba(255,_255,_255,_1)] via-[rgba(255,_255,_255,_0.5)] to-[rgba(255,_255,_255,_1)] text-transparent animate-shimmer">
														Thinking...
													</span>
												</Accordion.Trigger>
												<Accordion.Content className="markdown-renderer overflow-hidden italic text-[14px] text-inverse ml-[8px] pl-[12px] mb-[8px] data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown border-l border-l-inverse/20">
													<MemoizedMarkdown content={part.text} />
												</Accordion.Content>
											</Accordion.Item>
										</Accordion.Root>
									);
								}
								return (
									<Accordion.Root
										key={`messages.${message.id}.parts.[${index}].reason`}
										type="single"
										collapsible
										className="my-[8px]"
										defaultValue=""
									>
										<Accordion.Item
											value={`messages.${message.id}.parts.[${index}].reason`}
										>
											<Accordion.Trigger className="group text-inverse text-[12px] flex items-center gap-[4px] cursor-pointer hover:text-inverse transition-colors data-[state=open]:text-inverse outline-none font-sans">
												<ChevronRightIcon
													className="size-[16px] transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-90"
													aria-hidden
												/>
												<span>Thinking Process</span>
											</Accordion.Trigger>
											<Accordion.Content className="markdown-renderer overflow-hidden italic text-[14px] text-inverse ml-[8px] pl-[12px] mb-[8px] data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown border-l border-l-inverse/20">
												<MemoizedMarkdown content={part.text} />
											</Accordion.Content>
										</Accordion.Item>
									</Accordion.Root>
								);

							case "text":
								return (
									<div
										className="markdown-renderer"
										key={`${message.id}-${part.text}`}
									>
										<MemoizedMarkdown content={part.text} />
									</div>
								);
							default: {
								console.warn("unsupport part type");
								return null;
							}
						}
					})}
				</div>
			))}
			{generation.status !== "completed" &&
				generation.status !== "cancelled" &&
				// Show the spinner only when there is no reasoning part
				!generatedMessages.some((message) =>
					message.parts.some((part) => part.type === "reasoning"),
				) && (
					<div className="pt-[8px]">
						<Spinner />
					</div>
				)}

			{/* Image Viewer Overlay */}
			{lightboxImage && (
				<Lightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
			)}
		</>
	);
}

// function ToolBlock({
// 	generation,
// 	contextNodeId,
// }: {
// 	contextNodeId: NodeId;
// 	generation: RunningGeneration | CompletedGeneration | CancelledGeneration;
// }) {
// 	const contextNode = useMemo(
// 		() =>
// 			generation.context.sourceNodes.find(
// 				(sourceNode) => sourceNode.id === contextNodeId,
// 			),
// 		[generation, contextNodeId],
// 	);
// 	if (contextNode === undefined) {
// 		return null;
// 	}
// 	if (contextNode.content.type === "file") {
// 		return contextNode.content.files.map((file) => file.name).join(", ");
// 	}
// 	return null;
// }
