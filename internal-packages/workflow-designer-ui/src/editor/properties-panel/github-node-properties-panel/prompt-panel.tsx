import {
	ConnectionId,
	type GitHubNode,
	isGitHubNode,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import { toolGroups } from "@giselle-sdk/github-agent";
import {
	TextEditor,
	createSourceExtensionJSONContent,
} from "@giselle-sdk/text-editor/react-internal";
import clsx from "clsx/lite";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { BracesIcon } from "lucide-react";
import { DropdownMenu, Toolbar } from "radix-ui";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "../../../ui/select";
import { type Source, useConnectedSources } from "./sources";

function getDefaultNodeName(source: Source): string {
	if (isTextGenerationNode(source.node)) {
		return source.node.content.llm.model;
	}
	if (isGitHubNode(source.node)) {
		return "GitHub";
	}
	return source.node.type;
}

export function PromptPanel({ node }: { node: GitHubNode }) {
	const { updateNodeDataContent, updateNodeData } = useWorkflowDesigner();
	const { all: connectedSources } = useConnectedSources(node);

	return (
		<>
			<div className="mb-4">
				<SelectGroup>
					<Select
						value={node.content.toolName}
						onValueChange={(value: string) => {
							updateNodeDataContent(node, {
								...node.content,
								toolName: value,
							});
						}}
					>
						<SelectTrigger className="bg-slate-900 border-slate-700 text-white hover:border-blue-500 transition-all">
							<SelectValue placeholder="Select a GitHub tool" />
						</SelectTrigger>
						<SelectContent className="max-h-[400px] bg-slate-900 border-slate-700 p-2">
							{Object.entries(toolGroups).map(([key, group], groupIndex) => (
								<SelectGroup
									key={key}
									className={
										groupIndex > 0 ? "mt-4 pt-4 border-t border-slate-700" : ""
									}
								>
									<SelectLabel className="font-bold text-sm py-3 px-3 mb-3 text-blue-400 bg-slate-800/70 rounded-md flex items-center drop-shadow-sm">
										{group.name}
									</SelectLabel>
									<div className="pl-2 space-y-2">
										{group.tools.map((tool) => (
											<SelectItem
												key={tool.name}
												value={tool.name}
												className="relative flex flex-col py-2.5 px-3 my-0.5 rounded-md transition-all
                  hover:bg-slate-800 hover:shadow-md focus:bg-slate-800
                  data-[state=checked]:bg-slate-800 data-[state=checked]:text-blue-400 data-[state=checked]:border-l-2 data-[state=checked]:border-l-blue-500 data-[state=checked]:pl-[10px]"
											>
												<div className="font-medium flex items-center">
													{tool.name.includes("get") && (
														<span className="text-xs bg-green-800 text-green-200 px-1.5 py-0.5 rounded mr-2 uppercase font-bold">
															GET
														</span>
													)}
													{tool.name.includes("search") && (
														<span className="text-xs bg-purple-800 text-purple-200 px-1.5 py-0.5 rounded mr-2 uppercase font-bold">
															SEARCH
														</span>
													)}
													{tool.name.includes("list") && (
														<span className="text-xs bg-blue-800 text-blue-200 px-1.5 py-0.5 rounded mr-2 uppercase font-bold">
															LIST
														</span>
													)}
													{tool.name.includes("create") && (
														<span className="text-xs bg-yellow-800 text-yellow-200 px-1.5 py-0.5 rounded mr-2 uppercase font-bold">
															POST
														</span>
													)}
													{tool.name.includes("update") && (
														<span className="text-xs bg-orange-800 text-orange-200 px-1.5 py-0.5 rounded mr-2 uppercase font-bold">
															PUT
														</span>
													)}
													<span>{tool.name}</span>
												</div>
												<div className="text-xs text-slate-400 mt-1 ml-0.5">
													<div>{tool.description}</div>
													{tool.purpose && (
														<div className="mt-1 italic text-slate-500">
															{tool.purpose}
														</div>
													)}
												</div>
											</SelectItem>
										))}
									</div>
								</SelectGroup>
							))}
						</SelectContent>
					</Select>
				</SelectGroup>
			</div>

			<TextEditor
				value={node.content.prompt}
				onValueChange={(prompt) => {
					updateNodeData(node, {
						content: {
							...node.content,
							prompt,
						},
					});
				}}
				nodes={connectedSources.map((source) => source.node)}
				tools={(editor) => (
					<DropdownMenu.Root>
						<Toolbar.Button
							value="bulletList"
							aria-label="Bulleted list"
							data-toolbar-item
							asChild
						>
							<DropdownMenu.Trigger>
								<BracesIcon className="w-[18px]" />
							</DropdownMenu.Trigger>
						</Toolbar.Button>
						<DropdownMenu.Portal>
							<DropdownMenu.Content
								className={clsx(
									"relative w-[300px] rounded py-[8px]",
									"rounded-[8px] border-[1px] bg-transparent backdrop-blur-[8px]",
									"shadow-[-2px_-1px_0px_0px_rgba(0,0,0,0.1),1px_1px_8px_0px_rgba(0,0,0,0.25)]",
								)}
								onCloseAutoFocus={(e: Event) => {
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
										onValueChange={(connectionIdLike: string) => {
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
			/>
		</>
	);
}
