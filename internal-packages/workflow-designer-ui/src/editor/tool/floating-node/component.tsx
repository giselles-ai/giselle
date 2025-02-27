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
			if (tool.provider === undefined) {
				return null;
			}
			switch (tool.provider) {
				case "anthropic":
					return (
						<NodeComponent
							title="claude-3.5-sonnet"
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
							title="gemini-2.0-flash"
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
							title="gpt-4o"
							subtitle="OpenAI"
							nodeType="action"
							contentType="textGeneration"
							llmProvider="openai"
							preview
						/>
					);
				default: {
					const _exhaustiveCheck: never = tool.provider;
					throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
				}
			}
		case "addGitHubNode":
			return (
				<NodeComponent
					title="GitHub"
					nodeType="action"
					contentType="github"
					preview
				/>
			);
		default: {
			const _exhaustiveCheck: never = tool;
			throw new Error(`Unhandled tool action: ${_exhaustiveCheck}`);
		}
	}
}
