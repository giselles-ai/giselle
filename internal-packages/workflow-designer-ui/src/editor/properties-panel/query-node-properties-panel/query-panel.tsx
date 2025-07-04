import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import {
	isTextGenerationNode,
	isVectorStoreNode,
	type QueryNode,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle-engine/react";
import { TextEditor } from "@giselle-sdk/text-editor/react-internal";
import { createSourceExtensionJSONContent } from "@giselle-sdk/text-editor-utils";
import clsx from "clsx";
import { AtSignIcon, DatabaseZapIcon, X } from "lucide-react";
import { useMemo } from "react";
import { GitHubIcon } from "../../../icons";
import { type ConnectedSource, useConnectedSources } from "./sources";

// Style constants for consistent styling
const ICON_SIZE = "w-[14px] h-[14px]";
const TEXT_STYLES = {
	small: "text-[11px]",
	badge: "text-[10px] font-medium",
} as const;

const BADGE_STYLES = {
	connected: "bg-blue-900/15 border border-blue-900/25 text-blue-100",
	disconnected: "bg-white-900/8 border border-white-900/15",
} as const;

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
		<div className="flex flex-col h-full">
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
								<span className={clsx(TEXT_STYLES.small, "mr-2 text-blue-300")}>
									Querying {connectedDatasourceInputs.length} data source
									{connectedDatasourceInputs.length !== 1 ? "s" : ""}:
								</span>
								{connectedDatasourceInputs.map((dataSource) => {
									const { name, description, icon } =
										getDataSourceDisplayInfo(dataSource);
									return (
										<div
											key={dataSource.connection.id}
											className={clsx(
												"flex items-center gap-[4px] px-[6px] py-[2px] rounded-[4px]",
												BADGE_STYLES.connected
											)}
										>
											<div className="shrink-0 text-blue-200">{icon}</div>
											<span
												className={TEXT_STYLES.badge}
												title={`${name} • ${description}`}
											>
												{description}
											</span>
											<button
												type="button"
												onClick={() =>
													deleteConnection(dataSource.connection.id)
												}
												className="ml-1 p-0.5 rounded transition-colors text-blue-300/70 hover:text-blue-300 hover:bg-blue-300/20"
												title="Remove data source"
											>
												<X className="w-3 h-3" />
											</button>
										</div>
									);
								})}
							</div>
						) : (
							<div className="flex items-center">
								<span className={clsx(TEXT_STYLES.small, "text-blue-300/60")}>
									No data sources connected • Connect from Input tab to query
								</span>
							</div>
						)
					}
					tools={(editor) => (
						<DropdownMenu
							trigger={<AtSignIcon className="w-[18px]" />}
							items={connectedInputsWithoutDatasource.map((input) => ({
								id: input.connection.id,
								input,
							}))}
							renderItem={(item) =>
								`${item.input.node.name ?? getDefaultNodeName(item.input)} / ${item.input.output.label}`
							}
							onSelect={(_, item) => {
								const embedNode = {
									outputId: item.input.connection.outputId,
									node: item.input.connection.outputNode,
								};
								editor
									.chain()
									.focus()
									.insertContentAt(
										editor.state.selection.$anchor.pos,
										createSourceExtensionJSONContent({
											node: item.input.connection.outputNode,
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
