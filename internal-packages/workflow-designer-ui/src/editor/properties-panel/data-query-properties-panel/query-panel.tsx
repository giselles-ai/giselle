import { defaultName } from "@giselles-ai/node-registry";
import type { DataQueryNode } from "@giselles-ai/protocol";
import { TextEditor } from "@giselles-ai/text-editor/react-internal";
import { X } from "lucide-react";
import {
	useRemoveConnectionAndInput,
	useUpdateNodeDataContent,
} from "../../../app-designer";
import { DataStoreIcon } from "../../../icons/node/data-store-icon";
import { SettingDetail } from "../ui/setting-label";
import { useConnectedSources } from "./sources";

export function DataQueryPanel({ node }: { node: DataQueryNode }) {
	const updateNodeDataContent = useUpdateNodeDataContent();
	const removeConnectionAndInput = useRemoveConnectionAndInput();
	const { datastore: connectedDataStores, connections } =
		useConnectedSources(node);

	const hasDataStoreConnections = connectedDataStores.length > 0;

	return (
		<div className="flex flex-col gap-[12px]">
			<TextEditor
				key={JSON.stringify(connections.map((c) => c.outputNode.id))}
				placeholder="Write your query here... Use @ to reference other nodes"
				value={node.content.query}
				onValueChange={(value) => {
					updateNodeDataContent(node, { query: value });
				}}
				connections={connections}
				showToolbar={false}
				editorClassName="bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] border-0 !pt-[12px] !pr-[12px] !pb-[12px] !pl-[12px] rounded-[8px] min-h-[180px]"
				header={
					<div className="flex flex-col gap-[8px]">
						{hasDataStoreConnections ? (
							<ul className="flex flex-wrap gap-[8px] m-0 p-0 list-none">
								{connectedDataStores.map((dataStore) => {
									const name = defaultName(dataStore.node);
									const status =
										dataStore.node.content.state.status === "configured"
											? "Connected"
											: "Requires setup";

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
								No data sources connected • Connect a Data Store node
							</SettingDetail>
						)}
					</div>
				}
			/>
		</div>
	);
}
