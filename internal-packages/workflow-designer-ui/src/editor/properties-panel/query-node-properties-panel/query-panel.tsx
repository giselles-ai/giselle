import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import { isVectorStoreNode, type QueryNode } from "@giselle-sdk/data-type";
import { defaultName, useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { TextEditor } from "@giselle-sdk/text-editor/react-internal";
import { createSourceExtensionJSONContent } from "@giselle-sdk/text-editor-utils";
import { AtSignIcon, DatabaseZapIcon, X } from "lucide-react";
import { Toolbar } from "radix-ui";
import { useMemo } from "react";
import { GitHubIcon } from "../../../icons";
import { type ConnectedSource, useConnectedSources } from "./sources";

function getDataSourceDisplayInfo(input: ConnectedSource): {
	name: string;
	description: { line1: string; line2?: string };
	icon: React.ReactElement;
} {
	const node = input.node;
	if (isVectorStoreNode(node)) {
		const name = node.name ?? "Vector Store";
		const icon = <GitHubIcon className="w-[14px] h-[14px]" />;

		switch (node.content.source.provider) {
			case "github": {
				if (node.content.source.state.status === "configured") {
					const { owner, repo, contentType } = node.content.source.state;
					const typeLabel =
						contentType === "pull_request" ? "Pull Requests" : "Code";
					return {
						name,
						description: {
							line1: `${owner}/${repo}`,
							line2: typeLabel,
						},
						icon,
					};
				}
				return {
					name,
					description: {
						line1: `GitHub: ${node.content.source.state.status}`,
						line2: "",
					},
					icon,
				};
			}
			default: {
				const _exhaustiveCheck: never = node.content.source.provider;
				throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
			}
		}
	}

	return {
		name: node.name ?? "Unknown",
		description: {
			line1: "Unknown source",
		},
		icon: <DatabaseZapIcon className="w-[14px] h-[14px]" />,
	};
}

export function QueryPanel({ node }: { node: QueryNode }) {
	const { updateNodeDataContent, deleteConnection } = useWorkflowDesigner();
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
		<div className="flex flex-col h-full gap-4">
			<div className="flex-1 min-h-0">
				<TextEditor
					placeholder="Write your query here..."
					value={node.content.query}
					onValueChange={(value) => {
						updateNodeDataContent(node, { query: value });
					}}
					nodes={connectedInputsWithoutDatasource.map((input) => input.node)}
					header={
						connectedDatasourceInputs.length > 0 ? (
							<div className="flex items-center gap-[6px] flex-wrap">
								<span className="text-[11px] mr-2" style={{ color: "#839DC3" }}>
									Querying {connectedDatasourceInputs.length} data source
									{connectedDatasourceInputs.length !== 1 ? "s" : ""}:
								</span>
								{connectedDatasourceInputs.map((dataSource) => {
									const { name, description, icon } =
										getDataSourceDisplayInfo(dataSource);

									return (
										<div
											key={dataSource.connection.id}
											className="flex items-center gap-[6px] px-[8px] py-[4px] rounded-[6px]"
											style={{
												backgroundColor: "rgba(131, 157, 195, 0.15)",
												borderColor: "rgba(131, 157, 195, 0.25)",
												border: "1px solid",
												color: "#839DC3",
											}}
										>
											<div className="shrink-0" style={{ color: "#839DC3" }}>
												{icon}
											</div>
											<div className="flex flex-col leading-tight">
												<span
													className="text-[10px] font-medium"
													style={{ color: "#839DC3" }}
													title={`${name} • ${description.line1}${description.line2 ? ` • ${description.line2}` : ""}`}
												>
													{description.line1}
												</span>
												{description.line2 && (
													<span
														className="text-[9px] opacity-70"
														style={{ color: "#839DC3" }}
													>
														{description.line2}
													</span>
												)}
											</div>
											<button
												type="button"
												onClick={() =>
													deleteConnection(dataSource.connection.id)
												}
												className="ml-1 p-0.5 rounded transition-colors"
												style={{
													color: "rgba(131, 157, 195, 0.7)",
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.color = "#839DC3";
													e.currentTarget.style.backgroundColor =
														"rgba(131, 157, 195, 0.2)";
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.color =
														"rgba(131, 157, 195, 0.7)";
													e.currentTarget.style.backgroundColor = "transparent";
												}}
												title="Remove data source"
											>
												<X className="w-3 h-3" />
											</button>
										</div>
									);
								})}
							</div>
						) : (
							<div className="flex items-center gap-[6px]">
								<span
									className="text-[11px]"
									style={{ color: "rgba(131, 157, 195, 0.6)" }}
								>
									No data sources connected • Connect from Input tab to query
								</span>
							</div>
						)
					}
					tools={(editor) => (
						<DropdownMenu
							trigger={
								<Toolbar.Button
									value="bulletList"
									aria-label="Insert sources"
									data-toolbar-item
								>
									<AtSignIcon className="w-[18px]" />
								</Toolbar.Button>
							}
							items={connectedInputsWithoutDatasource.map((source) => ({
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
			</div>
		</div>
	);
}
