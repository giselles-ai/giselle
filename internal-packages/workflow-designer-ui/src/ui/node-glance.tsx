import type { Node } from "@giselle-sdk/data-type";
import { useMemo } from "react";
import { NodeIcon } from "../icons/node";

export function NodeGlance({
	node,
	iconClassName,
	nameClassName,
	descriptionClassName,
}: {
	node: Node;
	iconClassName?: string;
	nameClassName?: string;
	descriptionClassName?: string;
}) {
	const nodeName = useMemo(() => {
		switch (node.content.type) {
			case "textGeneration":
			case "imageGeneration":
				return node.name ?? node.content.llm.id;
			case "file":
			case "text":
			case "github":
			case "trigger":
			case "action":
				return node.name ?? "Untitled Node";
			case "vectorStore": {
				return node.name ?? "Vector Store";
			}
			default: {
				const _exhaustiveCheck: never = node.content;
				throw new Error(`Unknown node content type: ${_exhaustiveCheck}`);
			}
		}
	}, [node.content, node.name]);
	const nodeDescription = useMemo(() => {
		switch (node.content.type) {
			case "textGeneration":
			case "imageGeneration":
				return node.content.llm.provider;
			case "file":
			case "text":
			case "github":
			case "trigger":
			case "action":
				return node.content.type;
			case "vectorStore": {
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
			default: {
				const _exhaustiveCheck: never = node.content;
				throw new Error(`Unknown node content type: ${_exhaustiveCheck}`);
			}
		}
	}, [node.content]);
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
