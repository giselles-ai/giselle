import {
	type CancelledGeneration,
	type CompletedGeneration,
	type Generation,
	type NodeId,
	type RunningGeneration,
	isCompletedGeneration,
	isFailedGeneration,
} from "@giselle-sdk/data-type";
import { useGiselleEngine } from "giselle-sdk/react";
import { useMemo } from "react";
import { WilliIcon } from "../icons";
import { MemoizedMarkdown } from "./memoized-markdown";

function Spinner() {
	return (
		<div className="flex gap-[12px] text-black-400">
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-1" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-2" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-3" />
		</div>
	);
}
export function GenerationView({
	generation,
}: {
	generation: Generation;
}) {
	const client = useGiselleEngine();
	const generatedMessages = useMemo(
		() => generation.messages?.filter((m) => m.role === "assistant") ?? [],
		[generation],
	);
	if (isFailedGeneration(generation)) {
		return generation.error.message;
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
			{isCompletedGeneration(generation) &&
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
					{message.parts?.map((part) => {
						switch (part.type) {
							case "reasoning":
								return <p key={part.reasoning}>{part.reasoning}</p>;

							case "text":
								return (
									<div className="markdown-renderer" key={`${message.id}-text`}>
										<MemoizedMarkdown content={part.text} />
									</div>
								);
							case "tool-invocation":
								/** @todo Tool invocation */
								return null;
							case "source":
								/** @todo Source */
								return null;
							case "file":
								/** @todo File parts */
								return null;
							case "step-start":
								/** @todo Step start */
								return null;
							default: {
								const _exhaustiveCheck: never = part;
								throw new Error(`Unhandled part type: ${_exhaustiveCheck}`);
							}
						}
					})}
				</div>
			))}
			{generation.status !== "completed" &&
				generation.status !== "cancelled" && (
					<div className="pt-[8px]">
						<Spinner />
					</div>
				)}
		</>
	);
}

function ToolBlock({
	generation,
	contextNodeId,
}: {
	contextNodeId: NodeId;
	generation: RunningGeneration | CompletedGeneration | CancelledGeneration;
}) {
	const contextNode = useMemo(
		() =>
			generation.context.sourceNodes.find(
				(sourceNode) => sourceNode.id === contextNodeId,
			),
		[generation, contextNodeId],
	);
	if (contextNode === undefined) {
		return null;
	}
	if (contextNode.content.type === "file") {
		return contextNode.content.files.map((file) => file.name).join(", ");
	}
	return null;
}
