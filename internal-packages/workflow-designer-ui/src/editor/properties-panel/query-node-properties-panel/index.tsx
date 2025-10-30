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
import { Tabs } from "radix-ui";
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
				onChangeName={(name) => updateNodeData(node, { name })}
				docsUrl="https://docs.giselles.ai/en/glossary/query-node"
				onDelete={() => deleteNode(node.id)}
			/>
			<PropertiesPanelContent>
				<div className="relative flex-1 min-h-0 flex flex-col">
					<div className="flex-1 min-h-0 overflow-y-auto">
						<div className="flex flex-col gap-[16px] px-[16px] pb-[12px]">
							<Tabs.Root
								className="flex flex-col gap-[12px]"
								defaultValue="query"
							>
								<Tabs.List className="inline-flex items-center gap-[4px] rounded-[8px] bg-inverse/10 p-[4px] text-[13px]">
									<Tabs.Trigger
										value="query"
										className="flex-1 rounded-[6px] px-[12px] py-[8px] text-left font-medium transition-colors data-[state=active]:bg-background data-[state=active]:text-inverse data-[state=inactive]:text-black-300 hover:text-inverse focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/40"
									>
										Query
									</Tabs.Trigger>
									<Tabs.Trigger
										value="settings"
										className="flex-1 rounded-[6px] px-[12px] py-[8px] text-left font-medium transition-colors data-[state=active]:bg-background data-[state=active]:text-inverse data-[state=inactive]:text-black-300 hover:text-inverse focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900/40"
									>
										Settings
									</Tabs.Trigger>
								</Tabs.List>
								<div className="min-h-0">
									<Tabs.Content
										value="query"
										className="outline-none focus-visible:ring-2 focus-visible:ring-primary-900/40 rounded-[8px]"
									>
										<QueryPanel node={node} />
									</Tabs.Content>
									<Tabs.Content
										value="settings"
										className="outline-none focus-visible:ring-2 focus-visible:ring-primary-900/40 rounded-[8px]"
									>
										<div className="px-[4px]">
											<SettingsPanel node={node} />
										</div>
									</Tabs.Content>
								</div>
							</Tabs.Root>

							<div>
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
