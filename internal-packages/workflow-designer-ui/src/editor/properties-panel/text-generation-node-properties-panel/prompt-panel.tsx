import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import type { TextGenerationNode } from "@giselle-sdk/data-type";
import { defaultName, useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { TextEditor } from "@giselle-sdk/text-editor/react-internal";
import { createSourceExtensionJSONContent } from "@giselle-sdk/text-editor-utils";
import { AtSignIcon } from "lucide-react";
import { useConnectedOutputs } from "./outputs";

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
					items={connectedSources.map((source, index) => ({
						value: index,
						label: `${defaultName(source.node)} / ${source.label}`,
						source,
					}))}
					renderItem={(item) =>
						`${defaultName(item.source.node)} / ${item.source.label}`
					}
					onSelect={(_, item) => {
						const connectedSource = item.source;
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
