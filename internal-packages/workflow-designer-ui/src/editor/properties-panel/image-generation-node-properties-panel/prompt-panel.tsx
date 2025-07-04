import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import {
	type ImageGenerationNode,
	isTextGenerationNode,
	Node,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle-engine/react";
import { TextEditor } from "@giselle-sdk/text-editor/react-internal";
import { createSourceExtensionJSONContent } from "@giselle-sdk/text-editor-utils";
import { AtSignIcon } from "lucide-react";
import { useMemo } from "react";
import { type Source, useConnectedSources } from "./sources";

function getDefaultNodeName(source: Source): string {
	if (isTextGenerationNode(source.node)) {
		return source.node.content.llm.id;
	}
	return source.node.type;
}

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
						id: source.connection.id,
						source,
					}))}
					renderItem={(item) =>
						`${item.source.node.name ?? getDefaultNodeName(item.source)} / ${item.source.output.label}`
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
			// tools={(editor) => (
			// 	<NodeDropdown
			// 		nodes={sourceNodes}
			// 		trigerNode={
			// 			<ToolbarPrimitive.Button
			// 				value="bulletList"
			// 				aria-label="Bulleted list"
			// 				data-toolbar-item
			// 				asChild
			// 			>
			// 				<DropdownMenuTrigger>
			// 					<BracesIcon className="w-[18px]" />
			// 				</DropdownMenuTrigger>
			// 			</ToolbarPrimitive.Button>
			// 		}
			// 		onValueChange={(node) => {
			// 			editor
			// 				.chain()
			// 				.focus()
			// 				.insertContentAt(
			// 					editor.state.selection.$anchor.pos,
			// 					`{{${node.id}}}`,
			// 				)
			// 				.run();
			// 		}}
			// 	/>
			// )}
		/>
	);
}
