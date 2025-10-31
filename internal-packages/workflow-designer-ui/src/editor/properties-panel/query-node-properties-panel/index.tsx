import { SettingLabel } from "@giselle-internal/ui/setting-label";
import { useToasts } from "@giselle-internal/ui/toast";
import type { QueryNode } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import {
	isJsonContent,
	jsonContentToText,
} from "@giselle-sdk/text-editor-utils";
import { useCallback, useMemo } from "react";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import {
	GenerateCtaButton,
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui";
import { NodePanelHeader } from "../ui/node-panel-header";
import { GenerationPanel } from "./generation-panel";
import { QueryPanel } from "./query-panel";
import { SettingsPanel } from "./settings-panel";
import { useConnectedSources } from "./sources";

export function QueryNodePropertiesPanel({ node }: { node: QueryNode }) {
	const { data, updateNodeData, deleteNode } = useWorkflowDesigner();
	const { createAndStartGenerationRunner, isGenerating, stopGenerationRunner } =
		useNodeGenerations({
			nodeId: node.id,
			origin: { type: "studio", workspaceId: data.id },
		});
	const { all: connectedSources } = useConnectedSources(node);
	const { error } = useToasts();

	const query = useMemo(() => {
		const rawQuery = node.content.query.trim();
		if (isJsonContent(rawQuery)) {
			return jsonContentToText(JSON.parse(rawQuery));
		}
		return rawQuery;
	}, [node.content.query]);

	useKeyboardShortcuts({
		onGenerate: () => {
			if (!isGenerating) {
				generate();
			}
		},
	});

	const generate = useCallback(() => {
		if (query.length === 0) {
			error("Query is empty");
			return;
		}
		createAndStartGenerationRunner({
			origin: {
				type: "studio",
				workspaceId: data.id,
			},
			operationNode: node,
			sourceNodes: connectedSources.map(
				(connectedSource) => connectedSource.node,
			),
			connections: data.connections.filter(
				(connection) => connection.inputNode.id === node.id,
			),
		});
	}, [
		connectedSources,
		data.id,
		data.connections,
		node,
		createAndStartGenerationRunner,
		error,
		query,
	]);

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				docsUrl="https://docs.giselles.ai/en/glossary/query-node"
				onDelete={() => deleteNode(node.id)}
			/>
			<PropertiesPanelContent>
				<div className="relative flex-1 min-h-0 flex flex-col">
					<div className="flex-1 min-h-0 overflow-y-auto">
						<div className="flex flex-col gap-[16px] px-[16px] pb-[12px]">
							<div className="flex flex-col gap-[8px]">
								<SettingLabel className="mb-[4px]">Settings</SettingLabel>
								<div className="px-[4px]">
									<SettingsPanel node={node} />
								</div>
							</div>
							<div className="flex flex-col gap-[8px]">
								<SettingLabel className="mb-[4px]">Query</SettingLabel>
								<QueryPanel node={node} />
							</div>
							<div className="flex flex-col gap-[8px]">
								<SettingLabel className="mb-[4px]">Output</SettingLabel>
								<GenerationPanel node={node} />
							</div>
						</div>
					</div>
					<div className="shrink-0 px-[16px] pt-[8px] pb-[4px] bg-gradient-to-t from-background via-background/80 to-transparent">
						<GenerateCtaButton
							isGenerating={isGenerating}
							isEmpty={query.length === 0}
							onClick={() => {
								if (isGenerating) {
									stopGenerationRunner();
								} else {
									generate();
								}
							}}
							idleLabel="Run Query"
							emptyLabel="Start Writing Your Query"
						/>
					</div>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
