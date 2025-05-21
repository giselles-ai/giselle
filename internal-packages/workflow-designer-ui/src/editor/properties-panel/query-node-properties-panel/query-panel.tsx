import {
	ConnectionId,
	type QueryNode,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import {
	TextEditor,
	createSourceExtensionJSONContent,
} from "@giselle-sdk/text-editor/react-internal";
import clsx from "clsx";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { AtSignIcon } from "lucide-react";
import { DropdownMenu, Toolbar } from "radix-ui";
import { type ConnectedSource, useConnectedSources } from "./sources";

function getDefaultNodeName(input: ConnectedSource): string {
	if (isTextGenerationNode(input.node)) {
		return input.node.content.llm.id;
	}
	return input.node.name ?? "";
}

export function QueryPanel({ node }: { node: QueryNode }) {
	const { updateNodeDataContent } = useWorkflowDesigner();
	const { all: connectedInputs } = useConnectedSources(node);

	return (
		<TextEditor
			value={node.content.query}
			onValueChange={(value) => {
				updateNodeDataContent(node, { query: value });
			}}
			nodes={connectedInputs.map((input) => input.node)}
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
										const connectedInput = connectedInputs.find(
											(connectedInput) =>
												connectedInput.connection.id === connectionId,
										);
										if (connectedInput === undefined) {
											return;
										}
										const embedNode = {
											outputId: connectedInput.connection.outputId,
											node: connectedInput.connection.outputNode,
										};
										editor
											.chain()
											.focus()
											.insertContentAt(
												editor.state.selection.$anchor.pos,
												createSourceExtensionJSONContent({
													node: connectedInput.connection.outputNode,
													outputId: embedNode.outputId,
												}),
											)
											.insertContent(" ")
											.run();
									}}
								>
									<div className="flex flex-col px-[8px]">
										{connectedInputs.map((input) => (
											<DropdownMenu.RadioItem
												key={input.connection.id}
												className="p-[8px] rounded-[8px] text-white-900 hover:bg-primary-900/50 transition-colors cursor-pointer text-[12px] outline-none select-none"
												value={input.connection.id}
											>
												{input.node.name ?? getDefaultNodeName(input)}/{" "}
												{input.output.label}
											</DropdownMenu.RadioItem>
										))}
									</div>
								</DropdownMenu.RadioGroup>
							</div>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			)}
		/>
	);
}
