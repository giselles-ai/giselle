import { type DataQueryNode, isDataStoreNode } from "@giselles-ai/protocol";
import type { UIConnection } from "@giselles-ai/react";
import { TextEditor } from "@giselles-ai/text-editor/react-internal";
import { X } from "lucide-react";
import { useMemo } from "react";
import {
	useAppDesignerStore,
	useRemoveConnectionAndInput,
	useUpdateNodeDataContent,
} from "../../../app-designer";
import { DataStoreIcon } from "../../../icons/node/data-store-icon";
import { SettingDetail } from "../ui/setting-label";

export function DataQueryPanel({ node }: { node: DataQueryNode }) {
	const updateNodeDataContent = useUpdateNodeDataContent();
	const removeConnectionAndInput = useRemoveConnectionAndInput();
	const connections = useAppDesignerStore((s) => s.connections);
	const nodes = useAppDesignerStore((s) => s.nodes);

	const connectedDataStores = useMemo(() => {
		const incomingConnections = connections.filter(
			(c) => c.inputNode.id === node.id,
		);
		return incomingConnections
			.map((c) => {
				const sourceNode = nodes.find((n) => n.id === c.outputNode.id);
				if (sourceNode && isDataStoreNode(sourceNode)) {
					return { node: sourceNode, connection: c };
				}
				return null;
			})
			.filter((n) => n !== null);
	}, [connections, node.id, nodes]);

	const connectedInputsWithoutDataStore = useMemo(() => {
		const incomingConnections = connections.filter(
			(c) => c.inputNode.id === node.id,
		);
		const uiConnections: UIConnection[] = [];
		for (const c of incomingConnections) {
			const outputNode = nodes.find((n) => n.id === c.outputNode.id);
			if (!outputNode || isDataStoreNode(outputNode)) {
				continue;
			}
			const output = outputNode.outputs.find((o) => o.id === c.outputId);
			if (!output) {
				continue;
			}
			const inputNode = nodes.find((n) => n.id === c.inputNode.id);
			if (!inputNode) {
				continue;
			}
			const input = inputNode.inputs.find((i) => i.id === c.inputId);
			if (!input) {
				continue;
			}
			uiConnections.push({
				id: c.id,
				outputNode,
				output,
				inputNode,
				input,
			});
		}
		return uiConnections;
	}, [connections, node.id, nodes]);

	const hasDataStoreConnections = connectedDataStores.length > 0;

	return (
		<div className="flex flex-col gap-[12px]">
			<TextEditor
				key={JSON.stringify(
					connectedInputsWithoutDataStore.map((c) => c.outputNode.id),
				)}
				placeholder="Enter your SQL query here... (e.g., SELECT * FROM users LIMIT 10)"
				value={node.content.query}
				onValueChange={(value) => {
					updateNodeDataContent(node, { query: value });
				}}
				connections={connectedInputsWithoutDataStore}
				showToolbar={false}
				editorClassName="bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] border-0 !pt-[12px] !pr-[12px] !pb-[12px] !pl-[12px] rounded-[8px] min-h-[180px] font-mono"
				header={
					<div className="flex flex-col gap-[8px]">
						{hasDataStoreConnections ? (
							<ul className="flex flex-wrap gap-[8px] m-0 p-0 list-none">
								{connectedDataStores.map((dataStore) => {
									const name = dataStore.node.name ?? "Data Store";
									const status =
										dataStore.node.content.state.status === "configured"
											? "Connected"
											: "Not configured";

									return (
										<li
											key={dataStore.connection.id}
											className="relative flex items-start gap-[8px] rounded-[8px] border border-[color-mix(in_srgb,var(--color-text-inverse,#fff)_20%,transparent)] px-[12px] py-[10px] pr-[34px]"
											aria-label={`${name}, ${status}`}
										>
											<div className="flex flex-col gap-[2px] text-left">
												<div className="flex items-center gap-[6px]">
													<span className="text-link-muted mt-[2px]">
														<DataStoreIcon
															className="w-[14px] h-[14px]"
															aria-hidden="true"
														/>
													</span>
													<span
														className="text-[12px] font-medium text-inverse"
														title={`${name} • ${status}`}
													>
														{name}
													</span>
												</div>
												<span className="text-[11px] text-link-muted">
													{status}
												</span>
											</div>
											<button
												type="button"
												aria-label={`Disconnect ${name}`}
												onClick={() => {
													removeConnectionAndInput(dataStore.connection.id);
												}}
												className="absolute top-[6px] right-[6px] size-[22px] rounded-full flex items-center justify-center text-link-muted hover:text-inverse hover:bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_20%,transparent)] transition-colors"
												title="Remove data source"
											>
												<X className="size-[12px]" />
											</button>
										</li>
									);
								})}
							</ul>
						) : (
							<SettingDetail
								size="sm"
								colorClassName="text-link-muted"
								className="text-[12px]"
							>
								No data store connected • Connect a Data Store node
							</SettingDetail>
						)}
					</div>
				}
			/>
		</div>
	);
}
