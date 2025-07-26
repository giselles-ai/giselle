import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import { type ImageGenerationNode, Node } from "@giselle-sdk/data-type";
import { defaultName, useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { TextEditor } from "@giselle-sdk/text-editor/react-internal";
import { createSourceExtensionJSONContent } from "@giselle-sdk/text-editor-utils";
import { AtSignIcon } from "lucide-react";
import { useMemo } from "react";
import { useConnectedSources } from "./sources";

export function PromptPanel({ node }: { node: ImageGenerationNode }) {
	const { updateNodeDataContent } = useWorkflowDesigner();
	const { all: connectedSources } = useConnectedSources(node);
	const nodes = useMemo(
		() =>
			connectedSources
				.map((source) => Node.safeParse(source.node))
				.map((parse) => (parse.success ? parse.data : null))
				.filter((data) => data !== null),
		[connectedSources],
	);

	return (
		<TextEditor
			value={node.content.prompt}
			onValueChange={(value) => {
				updateNodeDataContent(node, { prompt: value });
			}}
			nodes={nodes}
			tools={(editor) => (
				<DropdownMenu
					trigger={<AtSignIcon className="w-[18px]" />}
					items={connectedSources.map((source) => ({
						value: source.connection.id,
						label: `${defaultName(source.node)} / ${source.output.label}`,
						source,
					}))}
					renderItem={(item) =>
						`${defaultName(item.source.node)} / ${item.source.output.label}`
					}
					onSelect={(_, item) => {
						const embedNode = {
							outputId: item.source.connection.outputId,
							node: item.source.connection.outputNode,
						};
						editor
							.chain()
							.focus()
							.insertContentAt(
								editor.state.selection.$anchor.pos,
								createSourceExtensionJSONContent({
									node: item.source.connection.outputNode,
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
