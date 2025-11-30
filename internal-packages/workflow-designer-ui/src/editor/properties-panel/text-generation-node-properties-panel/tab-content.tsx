import type { TextGenerationNode } from "@giselles-ai/protocol";
import {
	PromptPanel,
	type PromptPanelSections,
	type PromptPanelSlots,
} from "./prompt-panel";

interface TextGenerationTabContentProps {
	node: TextGenerationNode;
	sections?: PromptPanelSections;
	slots?: PromptPanelSlots;
}

export function TextGenerationTabContent({
	node,
	sections,
	slots,
}: TextGenerationTabContentProps) {
	return <PromptPanel node={node} sections={sections} slots={slots} />;
}
