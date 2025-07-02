import {
	isImageGenerationNode,
	isTextGenerationNode,
	isVectorStoreNode,
	type NodeLike,
} from "@giselle-sdk/data-type";
import { useMemo } from "react";
import { NodeIcon } from "../icons/node";

export function NodeGlance({
	node,
	iconClassName,
	nameClassName,
	descriptionClassName,
}: {
	node: NodeLike;
	iconClassName?: string;
	nameClassName?: string;
	descriptionClassName?: string;
}) {
	const nodeName = useMemo(() => {
		switch (node.content.type) {
			case "textGeneration":
				if (!isTextGenerationNode(node)) {
					throw new Error("Node is not a text generation node");
				}
				return node.name ?? node.content.llm.id;
			case "imageGeneration":
				if (!isImageGenerationNode(node)) {
					throw new Error("Node is not a image generation node");
				}
				return node.name ?? node.content.llm.id;
			case "file":
			case "webPage":
			case "text":
			case "github":
			case "trigger":
			case "action":
			case "vectorStore":
			case "query":
				return node.name ?? "Untitled Node";
			default: {
				const _exhaustiveCheck: never = node.content;
				throw new Error(`Unknown node content type: ${_exhaustiveCheck}`);
			}
		}
	}, [node]);
	const nodeDescription = useMemo(() => {
		switch (node.content.type) {
			case "textGeneration":
				if (!isTextGenerationNode(node)) {
					throw new Error("Node is not a text generation node");
				}
				return node.name ?? node.content.llm.provider;
			case "imageGeneration":
				if (!isImageGenerationNode(node)) {
					throw new Error("Node is not a image generation node");
				}
				return node.name ?? node.content.llm.provider;
			case "vectorStore": {
				if (!isVectorStoreNode(node)) {
					throw new Error("Node is not a vector store node");
				}
				switch (node.content.source.provider) {
					case "github":
						if (node.content.source.state.status === "configured") {
							return `${node.content.source.state.owner}/${node.content.source.state.repo}`;
						}
						return `GitHub: ${node.content.source.state.status}`;
					default: {
						const _exhaustiveCheck: never = node.content.source.provider;
						throw new Error(
							`Unknown vector store provider: ${_exhaustiveCheck}`,
						);
					}
				}
			}
			case "file":
			case "webPage":
			case "text":
			case "github":
			case "trigger":
			case "action":
			case "query":
				return node.content.type;
			default: {
				const _exhaustiveCheck: never = node.content;
				throw new Error(`Unknown node content type: ${_exhaustiveCheck}`);
			}
		}
	}, [node]);
	return (
		<div className="flex gap-[8px] overflow-hidden">
			<div className="flex items-center justify-center">
				<div className={iconClassName}>
					<NodeIcon node={node} />
				</div>
			</div>
			<div className="flex flex-col items-start overflow-hidden">
				<p className={nameClassName}>{nodeName}</p>
				<p className={descriptionClassName}>{nodeDescription}</p>
			</div>
		</div>
	);
}
