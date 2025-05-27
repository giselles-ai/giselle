import {
	ConnectionId,
	type ImageGenerationNode,
	Node,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import { createSourceExtensionJSONContent } from "@giselle-sdk/text-editor-utils";
import { TextEditor } from "@giselle-sdk/text-editor/react-internal";
import clsx from "clsx/lite";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { AtSignIcon } from "lucide-react";
import { DropdownMenu, Toolbar } from "radix-ui";
import { useMemo } from "react";
import { type Source, useConnectedSources } from "./sources";

function getDefaultNodeName(source: Source): string {
	if (isTextGenerationNode(source.node)) {
		return source.node.content.llm.id;
	}
	return source.node.type;
}

export function PromptPanel({
	node,
}: {
	node: ImageGenerationNode;
}) {
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
				<DropdownMenu.Root>
					<Toolbar.Button
						value="bulletList"
						aria-label="Bulleted list"
						data-toolbar-item
						asChild
					>
						<DropdownMenu.Trigger>
							<AtSignIcon className="w-[18px]" />
						</DropdownMenu.Trigger>
					</Toolbar.Button>
					<DropdownMenu.Portal>
						<DropdownMenu.Content
							className={clsx(
								"relative w-[300px] rounded py-[8px]",
								"rounded-[8px] border-[1px] bg-transparent backdrop-blur-[8px]",
								"shadow-[-2px_-1px_0px_0px_rgba(0,0,0,0.1),1px_1px_8px_0px_rgba(0,0,0,0.25)]",
							)}
							onCloseAutoFocus={(e) => {
								e.preventDefault();
							}}
						>
							<div
								className={clsx(
									"absolute z-0 rounded-[8px] inset-0 border-[1px] mask-fill bg-gradient-to-br bg-origin-border bg-clip-boarder border-transparent",
									"from-[hsl(232,_36%,_72%)]/40 to-[hsl(218,_58%,_21%)]/90",
								)}
							/>
							<div className="relative flex flex-col gap-[8px]">
								<div className="flex px-[16px] text-white-900">
									Insert Sources
								</div>
								<div className="flex flex-col py-[4px]">
									<div className="border-t border-black-300/20" />
								</div>

								<DropdownMenu.RadioGroup
									className="flex flex-col pb-[8px] gap-[8px]"
									onValueChange={(connectionIdLike) => {
										const parsedConnectionId =
											ConnectionId.safeParse(connectionIdLike);
										if (!parsedConnectionId.success) {
											return;
										}
										const connectionId = parsedConnectionId.data;
										const connectedSource = connectedSources.find(
											(connectedSource) =>
												connectedSource.connection.id === connectionId,
										);
										if (connectedSource === undefined) {
											return;
										}
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
								>
									<div className="flex flex-col px-[8px]">
										{connectedSources.map((source) => (
											<DropdownMenu.RadioItem
												key={source.connection.id}
												className="p-[8px] rounded-[8px] text-white-900 hover:bg-primary-900/50 transition-colors cursor-pointer text-[12px] outline-none select-none"
												value={source.connection.id}
											>
												{source.node.name ?? getDefaultNodeName(source)}/{" "}
												{source.output.label}
											</DropdownMenu.RadioItem>
										))}
									</div>
								</DropdownMenu.RadioGroup>
							</div>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
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
