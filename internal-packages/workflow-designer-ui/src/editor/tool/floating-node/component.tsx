import { NodeComponent } from "../../node";
import type { Tool } from "../types";
import { useMousePosition } from "./state";

export const FloatingNodePreview = ({
	tool,
}: {
	tool: Tool;
}) => {
	const mousePosition = useMousePosition();

	return (
		<>
			<div
				className="fixed pointer-events-none inset-0"
				style={{
					transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
				}}
			>
				<div className="w-[180px]">
					<PreviewNode tool={tool} />
				</div>
			</div>
		</>
	);
};

export function PreviewNode({ tool }: { tool: Tool }) {
	if (tool.category !== "edit") {
		return null;
	}
	switch (tool.action) {
		case "addTextNode":
			return (
				<NodeComponent
					title="Text"
					nodeType="variable"
					contentType="text"
					preview
				/>
			);
		case "addFileNode":
			if (tool.fileCategory === undefined) {
				return null;
			}
			switch (tool.fileCategory) {
				case "pdf":
					return (
						<NodeComponent
							title="PDF File"
							nodeType="variable"
							contentType="file"
							fileCategory="pdf"
							preview
						/>
					);
				case "image":
					return (
						<NodeComponent
							title="Image"
							nodeType="variable"
							contentType="file"
							fileCategory="image"
							preview
						/>
					);
				case "text":
					return (
						<NodeComponent
							title="Text File"
							nodeType="variable"
							contentType="file"
							fileCategory="text"
							preview
						/>
					);
				default: {
					const _exhaustiveCheck: never = tool.fileCategory;
					throw new Error(`Unhandled file category: ${_exhaustiveCheck}`);
				}
			}
		case "addTextGenerationNode":
			if (tool.languageModel === undefined) {
				return null;
			}
			switch (tool.languageModel.provider) {
				case "anthropic":
					return (
						<NodeComponent
							title={tool.languageModel.id}
							subtitle="anthropic"
							nodeType="action"
							llmProvider="anthropic"
							contentType="textGeneration"
							preview
						/>
					);
				case "google":
					return (
						<NodeComponent
							title={tool.languageModel.id}
							subtitle="google"
							nodeType="action"
							contentType="textGeneration"
							llmProvider="google"
							preview
						/>
					);
				case "openai":
					return (
						<NodeComponent
							title={tool.languageModel.id}
							subtitle="OpenAI"
							nodeType="action"
							contentType="textGeneration"
							llmProvider="openai"
							preview
						/>
					);
				default: {
					const _exhaustiveCheck: never = tool.languageModel;
					throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
				}
			}
		default: {
			const _exhaustiveCheck: never = tool;
			throw new Error(`Unhandled tool action: ${_exhaustiveCheck}`);
		}
	}
}
