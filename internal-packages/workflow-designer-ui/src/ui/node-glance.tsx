import type { Node } from "@giselle-sdk/data-type";
import { useMemo } from "react";
import {
	AnthropicIcon,
	GoogleWhiteIcon,
	OpenaiIcon,
	PdfFileIcon,
	PictureIcon,
	PromptIcon,
	TextFileIcon,
} from "../icons";

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
				return node.name ?? node.content.llm.id;
			case "file":
			case "text":
				return node.name ?? "Unnamed Node";
			default: {
				const _exhaustiveCheck: never = node.content;
				return _exhaustiveCheck;
			}
		}
	}, [node.content, node.name]);
	const nodeDescription = useMemo(() => {
		switch (node.content.type) {
			case "textGeneration":
				return node.content.llm.provider;
			case "file":
			case "text":
				return node.content.type;
			default: {
				const _exhaustiveCheck: never = node.content;
				return _exhaustiveCheck;
			}
		}
	}, [node.content]);
	return (
		<div className="flex gap-[8px] overflow-hidden">
			<div className="flex items-center justify-center">
				<div className={iconClassName}>
					<ContentTypeIcon node={node} />
				</div>
			</div>
			<div className="flex flex-col items-start overflow-hidden">
				<p className={nameClassName}>{nodeName}</p>
				<p className={descriptionClassName}>{nodeDescription}</p>
			</div>
		</div>
	);
}

function ContentTypeIcon({
	node,
	...props
}: { node: Node; className?: string }) {
	switch (node.content.type) {
		case "textGeneration":
			switch (node.content.llm.provider) {
				case "openai":
					return <OpenaiIcon {...props} data-content-type-icon />;
				case "anthropic":
					return <AnthropicIcon {...props} data-content-type-icon />;
				case "google":
					return <GoogleWhiteIcon {...props} data-content-type-icon />;
				default: {
					const _exhaustiveCheck: never = node.content.llm;
					throw new Error(`Unhandled LLMProvider: ${_exhaustiveCheck}`);
				}
			}
		case "text":
			return <PromptIcon {...props} />;
		case "file":
			switch (node.content.category) {
				case "pdf":
					return <PdfFileIcon {...props} data-content-type-icon />;
				case "text":
					return <TextFileIcon {...props} data-content-type-icon />;
				case "image":
					return <PictureIcon {...props} data-content-type-icon />;
				default: {
					const _exhaustiveCheck: never = node.content.category;
					throw new Error(`Unhandled FileCategory: ${_exhaustiveCheck}`);
				}
			}
		default: {
			const _exhaustiveCheck: never = node.content;
			throw new Error(`Unhandled ContentType: ${_exhaustiveCheck}`);
		}
	}
}
