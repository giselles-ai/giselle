"use client";

import type { Generation } from "@giselle-sdk/giselle";
import { useGiselleEngine } from "@giselle-sdk/giselle/react";
import type { UIMessage } from "ai";
import { ChevronRightIcon } from "lucide-react";
import { Accordion } from "radix-ui";
import { useMemo } from "react";
import { WilliIcon } from "../icons";

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
		<div className="flex gap-[12px] text-black-400">
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-1" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-2" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-3" />
		</div>
	);
}
export function GenerationView({ generation }: { generation: Generation }) {
	const client = useGiselleEngine();
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
	return (
		<>
			{generation.status === "completed" &&
				generation.outputs.map((output) => {
					if (output.type !== "generated-image") {
						return null;
					}
					return (
						<div key={output.outputId} className="h-full flex gap-[12px]">
							{output.contents.map((content) => (
								<img
									src={`${client.basePath}/${content.pathname}`}
									alt="generated file"
									key={content.filename}
									className="h-full"
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
												<Accordion.Trigger className="group text-white-400 text-[12px] flex items-center gap-[4px] cursor-pointer hover:text-white-800 transition-colors data-[state=open]:text-white-800 outline-none font-sans">
													<ChevronRightIcon
														className="size-[16px] transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-90"
														aria-hidden
													/>
													<span className="bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-[rgba(255,_255,_255,_1)] via-[rgba(255,_255,_255,_0.5)] to-[rgba(255,_255,_255,_1)] text-transparent animate-shimmer">
														Thinking...
													</span>
												</Accordion.Trigger>
												<Accordion.Content className="markdown-renderer overflow-hidden italic text-[14px] text-white-400 ml-[8px] pl-[12px] mb-[8px] data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown border-l border-l-white-400/20">
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
											<Accordion.Trigger className="group text-white-400 text-[12px] flex items-center gap-[4px] cursor-pointer hover:text-white-800 transition-colors data-[state=open]:text-white-800 outline-none font-sans">
												<ChevronRightIcon
													className="size-[16px] transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-90"
													aria-hidden
												/>
												<span>Thinking Process</span>
											</Accordion.Trigger>
											<Accordion.Content className="markdown-renderer overflow-hidden italic text-[14px] text-white-400 ml-[8px] pl-[12px] mb-[8px] data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown border-l border-l-white-400/20">
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
					message.parts.some(
						(part) =>
							part.type === "reasoning" && generation.status === "running",
					),
				) && (
					<div className="pt-[8px]">
						<Spinner />
					</div>
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
