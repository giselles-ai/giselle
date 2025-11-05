import type { TextGenerationNode } from "@giselles-ai/protocol";
import {
	PromptPanel,
	type PromptPanelSections,
	type PromptPanelSlots,
} from "./prompt-panel";

interface TextGenerationTabContentProps {
	node: TextGenerationNode;
	onPromptExpand?: () => void;
	sections?: PromptPanelSections;
	slots?: PromptPanelSlots;
	editorVersion?: number;
}

export function TextGenerationTabContent({
	node,
	onPromptExpand,
	sections,
	slots,
	editorVersion,
}: TextGenerationTabContentProps) {
	return (
		<PromptPanel
			node={node}
			onExpand={onPromptExpand}
			sections={sections}
			slots={slots}
			editorVersion={editorVersion}
		/>
	);
}
