import type { TextGenerationNode } from "@giselle-sdk/data-type";
import { PromptPanel } from "./prompt-panel";

interface TextGenerationTabContentProps {
	node: TextGenerationNode;
}

export function TextGenerationTabContent({
	node,
}: TextGenerationTabContentProps) {
	return <PromptPanel node={node} />;
}
