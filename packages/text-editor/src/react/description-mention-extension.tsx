import { DescriptionMentionExtension } from "@giselles-ai/text-editor-utils";
import {
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";

const CHIP_CLASS =
	"rounded-[4px] px-[4px] py-[2px] bg-[rgba(139,92,246,0.25)] text-[#c4b5fd] text-[12px] align-baseline cursor-default";

function DescriptionMentionView({ node }: NodeViewProps) {
	return (
		<NodeViewWrapper as="span" className="inline">
			<span contentEditable={false} className={CHIP_CLASS}>
				{node.attrs.label}
			</span>
		</NodeViewWrapper>
	);
}

export const DescriptionMentionExtensionReact =
	DescriptionMentionExtension.extend({
		addNodeView() {
			return ReactNodeViewRenderer(DescriptionMentionView);
		},
	});
