import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import {
	isTextGenerationNode,
	type TextGenerationNode,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle-engine/react";
import { TextEditor } from "@giselle-sdk/text-editor/react-internal";
import { createSourceExtensionJSONContent } from "@giselle-sdk/text-editor-utils";
import clsx from "clsx/lite";
import { AtSignIcon } from "lucide-react";
import { type OutputWithDetails, useConnectedOutputs } from "./outputs";

function getDefaultNodeName(source: OutputWithDetails): string {
	if (isTextGenerationNode(source.node)) {
		return source.node.content.llm.id;
	}
	return source.node.type;
}

export function PromptPanel({ node }: { node: TextGenerationNode }) {
	const { updateNodeDataContent } = useWorkflowDesigner();
	const { all: connectedSources } = useConnectedOutputs(node);

	return (
		<TextEditor
			placeholder="Write your prompt here..."
			value={node.content.prompt}
			onValueChange={(value) => {
				updateNodeDataContent(node, { prompt: value });
			}}
			nodes={connectedSources.map((source) => source.node)}
			tools={(editor) => (
				<DropdownMenu
					trigger={<AtSignIcon className="w-[18px]" />}
					items={connectedSources}
					renderItem={(connectedSource) =>
						`${connectedSource.node.name ?? getDefaultNodeName(connectedSource)} / ${connectedSource.label}`
					}
					onSelect={(_, connectedSource) => {
						const embedNode = {
							outputId: connectedSource.connection.outputId,
							node: connectedSource.connection.outputNode,
						};
						editor
							.chain()
							.focus()
							.insertContentAt(
								editor.state.selection.$anchor.pos,
								createSourceExtensionJSONContent({
									node: connectedSource.connection.outputNode,
									outputId: embedNode.outputId,
								}),
							)
							.insertContent(" ")
							.run();
					}}
				/>
			)}
		/>
	);
}
