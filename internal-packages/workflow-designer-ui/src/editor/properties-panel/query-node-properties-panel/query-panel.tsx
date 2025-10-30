import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import { SettingDetail } from "@giselle-internal/ui/setting-label";
import { isVectorStoreNode, type QueryNode } from "@giselle-sdk/data-type";
import {
	defaultName,
	useVectorStore,
	useWorkflowDesigner,
	type VectorStoreContextValue,
} from "@giselle-sdk/giselle/react";
import { TextEditor } from "@giselle-sdk/text-editor/react-internal";
import { createSourceExtensionJSONContent } from "@giselle-sdk/text-editor-utils";
import { AtSignIcon, DatabaseZapIcon, X } from "lucide-react";
import { Toolbar } from "radix-ui";
import { useMemo } from "react";
import { GitHubIcon } from "../../../icons";
import { DocumentVectorStoreIcon } from "../../../icons/node/document-vector-store-icon";
import { type ConnectedSource, useConnectedSources } from "./sources";

type DocumentVectorStoreSummary = NonNullable<
	VectorStoreContextValue["documentStores"]
>[number];

function getDocumentStoreStatus(
	store: DocumentVectorStoreSummary | undefined,
	fallbackStatus?: string,
): string {
	if (!store) {
		if (fallbackStatus === "configured") {
			return "Requires setup";
		}
		return fallbackStatus ?? "Store unavailable";
	}
	const total = store.sources.length;
	if (total === 0) {
		return "No uploads yet";
	}
	const failed = store.sources.filter(
		(source) => source.ingestStatus === "failed",
	).length;
	if (failed > 0) {
		return `${failed}/${total} failed`;
	}
	const running = store.sources.filter(
		(source) => source.ingestStatus === "running",
	).length;
	if (running > 0) {
		return `${running}/${total} processing`;
	}
	const completed = store.sources.filter(
		(source) => source.ingestStatus === "completed",
	).length;
	if (completed === total) {
		return `${total} ready`;
	}
	return `${completed}/${total} ready`;
}

function getDataSourceDisplayInfo(
	input: ConnectedSource,
	documentStoreMap: Map<string, DocumentVectorStoreSummary>,
): {
	name: string;
	description: { line1: string; line2?: string };
	icon: React.ReactElement;
} {
	const node = input.node;
	if (isVectorStoreNode(node)) {
		const name = node.name ?? "Vector Store";

		switch (node.content.source.provider) {
			case "github": {
				const icon = (
					<GitHubIcon className="w-[14px] h-[14px]" aria-hidden="true" />
				);
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
			case "document": {
				const icon = (
					<DocumentVectorStoreIcon
						className="w-[14px] h-[14px]"
						aria-hidden="true"
					/>
				);
				if (node.content.source.state.status !== "configured") {
					return {
						name,
						description: {
							line1: "Document vector store",
							line2: "Requires setup",
						},
						icon,
					};
				}
				const store = documentStoreMap.get(
					node.content.source.state.documentVectorStoreId,
				);
				const storeStatus = getDocumentStoreStatus(
					store,
					node.content.source.state.status,
				);
				const nodeLabel = name;
				const storeName = store?.name?.trim() ?? "";
				const descriptionLine1 =
					storeName.length > 0 && storeName !== nodeLabel
						? storeName
						: "Document vector store";
				return {
					name: nodeLabel,
					description: {
						line1: descriptionLine1,
						line2: storeStatus,
					},
					icon,
				};
			}
		}
	}

	return {
		name: node.name ?? "Unknown",
		description: {
			line1: "Unknown source",
		},
		icon: <DatabaseZapIcon className="w-[14px] h-[14px]" aria-hidden="true" />,
	};
}

export function QueryPanel({ node }: { node: QueryNode }) {
	const { updateNodeDataContent, deleteConnection, updateNodeData } =
		useWorkflowDesigner();
	const vectorStore = useVectorStore();
	const documentStores = vectorStore?.documentStores ?? [];
	const documentStoreMap = useMemo(() => {
		const map = new Map<string, DocumentVectorStoreSummary>();
		documentStores.forEach((store) => {
			map.set(store.id, store);
		});
		return map;
	}, [documentStores]);
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

	const hasDatasourceConnections = connectedDatasourceInputs.length > 0;

	return (
		<div className="flex flex-col gap-[12px]">
			<TextEditor
				key={JSON.stringify(
					connectedInputsWithoutDatasource.map(
						(connectedInput) => connectedInput.node.id,
					),
				)}
				placeholder="Write your query here..."
				value={node.content.query}
				onValueChange={(value) => {
					updateNodeDataContent(node, { query: value });
				}}
				nodes={connectedInputsWithoutDatasource.map((input) => input.node)}
				connectedSources={connectedInputsWithoutDatasource.map(
					({ node, output }) => ({
						node,
						output,
					}),
				)}
				showToolbar
				editorClassName="bg-inverse/10 border border-white-400/10 !pt-[12px] !pr-[12px] !pb-[12px] !pl-[12px] rounded-[8px] min-h-[180px] focus:outline-none focus:ring-2 focus:ring-primary-900/40"
				header={
					<div className="flex flex-col gap-[8px]">
						{hasDatasourceConnections ? (
							<>
								<SettingDetail size="sm" colorClassName="text-black-200">
									Querying {connectedDatasourceInputs.length} data source
									{connectedDatasourceInputs.length !== 1 ? "s" : ""}:
								</SettingDetail>
								<ul className="flex flex-wrap gap-[8px] m-0 p-0 list-none">
									{connectedDatasourceInputs.map((dataSource) => {
										const { name, description, icon } =
											getDataSourceDisplayInfo(dataSource, documentStoreMap);
										const labelPieces = [
											name,
											description.line1,
											description.line2,
										]
											.filter((piece): piece is string =>
												Boolean(piece?.trim()),
											)
											.map((piece) => piece.trim());

										return (
											<li
												key={dataSource.connection.id}
												className="relative flex items-start gap-[8px] rounded-[8px] border border-white-400/10 bg-inverse/10 px-[12px] py-[10px] pr-[34px]"
												aria-label={labelPieces.join(", ")}
											>
												<div className="mt-[2px] text-secondary">{icon}</div>
												<div className="flex flex-col gap-[2px] text-left">
													<span
														className="text-[12px] font-medium text-inverse"
														title={`${name} • ${description.line1}${description.line2 ? ` • ${description.line2}` : ""}`}
													>
														{name}
													</span>
													<span className="text-[11px] text-black-300">
														{description.line1}
													</span>
													{description.line2 && (
														<span className="text-[11px] text-black-300">
															{description.line2}
														</span>
													)}
												</div>
												<button
													type="button"
													aria-label={`Disconnect ${name}`}
													onClick={() => {
														deleteConnection(dataSource.connection.id);
														updateNodeData(node, {
															inputs: node.inputs.filter(
																(input) =>
																	input.id !== dataSource.connection.inputId,
															),
														});
													}}
													className="absolute top-[6px] right-[6px] size-[22px] rounded-full flex items-center justify-center text-black-300 hover:text-inverse hover:bg-inverse/20 transition-colors"
													title="Remove data source"
												>
													<X className="size-[12px]" />
												</button>
											</li>
										);
									})}
								</ul>
							</>
						) : (
							<SettingDetail size="sm" colorClassName="text-black-200">
								No data sources connected • Connect from Input tab to query
							</SettingDetail>
						)}
					</div>
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
	);
}
