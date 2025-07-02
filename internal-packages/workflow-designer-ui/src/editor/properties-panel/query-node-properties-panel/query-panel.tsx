import {
	ConnectionId,
	isTextGenerationNode,
	isVectorStoreNode,
	type QueryNode,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle-engine/react";
import { TextEditor } from "@giselle-sdk/text-editor/react-internal";
import { createSourceExtensionJSONContent } from "@giselle-sdk/text-editor-utils";
import clsx from "clsx";
import { AtSignIcon, DatabaseZapIcon } from "lucide-react";
import { DropdownMenu, Toolbar } from "radix-ui";
import { useMemo } from "react";
import { GitHubIcon } from "../../../icons";
import { type ConnectedSource, useConnectedSources } from "./sources";

function getDefaultNodeName(input: ConnectedSource): string {
	if (isTextGenerationNode(input.node)) {
		return input.node.content.llm.id;
	}
	return input.node.name ?? "";
}

function getDataSourceDisplayInfo(input: ConnectedSource) {
	const node = input.node;
	if (isVectorStoreNode(node)) {
		const name = node.name ?? "Vector Store";
		let description = "";
		let icon = <DatabaseZapIcon className="w-[14px] h-[14px]" />;

		switch (node.content.source.provider) {
			case "github":
				icon = <GitHubIcon className="w-[14px] h-[14px]" />;
				if (node.content.source.state.status === "configured") {
					const { owner, repo } = node.content.source.state;
					description = `${owner}/${repo}`;
				} else {
					description = `GitHub: ${node.content.source.state.status}`;
				}
				break;
			default:
				description = `${node.content.source.provider} vector store`;
		}

		return { name, description, icon };
	}

	return {
		name: node.name ?? "Unknown",
		description: "Unknown source",
		icon: <DatabaseZapIcon className="w-[14px] h-[14px]" />,
	};
}

function DataSourceDisplayBar({
	dataSources,
}: {
	dataSources: ConnectedSource[];
}) {
	if (dataSources.length === 0) {
		return (
			<div
				className={clsx(
					"flex items-center gap-[8px] px-[12px] py-[8px] rounded-[6px] mt-[8px]",
					"bg-white-900/8 border border-white-900/15",
				)}
			>
				<DatabaseZapIcon className="w-[14px] h-[14px] text-white-600" />
				<p className="text-[11px] text-white-600">
					No data sources connected • Connect from Input tab to query
				</p>
			</div>
		);
	}

	return (
		<div
			className={clsx(
				"flex flex-col gap-1 px-2 py-1 rounded-[6px] my-2",
				"bg-blue-900/8 border border-blue-900/15",
			)}
		>
			<div className="flex items-center gap-[8px]">
				<DatabaseZapIcon className="w-[14px] h-[14px] text-blue-300" />
				<span className="text-[11px] text-blue-200">
					Querying {dataSources.length} data source
					{dataSources.length !== 1 ? "s" : ""}:
				</span>
			</div>
			<div className="flex items-center gap-[6px] flex-wrap">
				{dataSources.map((dataSource) => {
					const { name, description, icon } =
						getDataSourceDisplayInfo(dataSource);
					return (
						<div
							key={dataSource.connection.id}
							className={clsx(
								"flex items-center gap-[4px] px-[6px] py-[2px] rounded-[4px]",
								"bg-blue-900/15 border border-blue-900/25 text-blue-100",
							)}
						>
							<div className="text-blue-200 shrink-0">{icon}</div>
							<span
								className="text-[10px] font-medium"
								title={`${name} • ${description}`}
							>
								{name} • {description}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export function QueryPanel({ node }: { node: QueryNode }) {
	const { updateNodeDataContent } = useWorkflowDesigner();
	const { all: connectedInputs } = useConnectedSources(node);
	const connectedDatasourceInputs = useMemo(
		() =>
			connectedInputs.filter(
				(input) => input.node.content.type === "vectorStore",
			),
		[connectedInputs],
	);
	const connectedInputsWithoutDatasource = useMemo(
		() =>
			connectedInputs.filter(
				(input) => !connectedDatasourceInputs.includes(input),
			),
		[connectedInputs, connectedDatasourceInputs],
	);

	return (
		<div className="flex flex-col h-full">
			<div className="flex-1 min-h-0">
				<TextEditor
					value={node.content.query}
					onValueChange={(value) => {
						updateNodeDataContent(node, { query: value });
					}}
					nodes={connectedInputsWithoutDatasource.map((input) => input.node)}
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
												const connectedInput =
													connectedInputsWithoutDatasource.find(
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
												{connectedInputsWithoutDatasource.map((input) => (
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
			</div>
			<DataSourceDisplayBar dataSources={connectedDatasourceInputs} />
		</div>
	);
}
