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
import { CommandIcon, CornerDownLeft, DatabaseZapIcon } from "lucide-react";
import { Tabs } from "radix-ui";
import { useCallback, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Button } from "../../../ui/button";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
	ResizeHandle,
} from "../ui";
import { GenerationPanel } from "./generation-panel";
import { QueryPanel } from "./query-panel";
import { SettingsPanel } from "./settings-panel";
import { useConnectedSources } from "./sources";

export function QueryNodePropertiesPanel({ node }: { node: QueryNode }) {
	const { data, updateNodeData } = useWorkflowDesigner();
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

	// Use keyboard shortcuts hook with generate callback
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
			<PropertiesPanelHeader
				icon={<DatabaseZapIcon className="size-[20px] text-black-900" />}
				node={node}
				description="Query"
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
				action={
					<Button
						type="button"
						onClick={() => {
							if (isGenerating) {
								stopGenerationRunner();
							} else {
								generate();
							}
						}}
						disabled={query.length === 0}
						className="w-[150px] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isGenerating ? (
							<span>Stop</span>
						) : (
							<>
								<span>Query</span>
								<kbd className="flex items-center text-[12px]">
									<CommandIcon className="size-[12px]" />
									<CornerDownLeft className="size-[12px]" />
								</kbd>
							</>
						)}
					</Button>
				}
			/>

			<PropertiesPanelContent>
				<PanelGroup direction="vertical" className="flex-1 flex flex-col">
					<Panel>
						<PropertiesPanelContent>
							<Tabs.Root
								className="flex flex-col gap-[8px] h-full"
								defaultValue="query"
							>
								<Tabs.List className="flex gap-[16px] text-[14px] font-accent **:p-[4px] **:border-b **:cursor-pointer **:data-[state=active]:text-white-900 **:data-[state=active]:border-white-900 **:data-[state=inactive]:text-black-400 **:data-[state=inactive]:border-transparent">
									<Tabs.Trigger value="query">Query</Tabs.Trigger>
									<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
								</Tabs.List>
								<Tabs.Content
									value="query"
									className="flex-1 flex flex-col overflow-hidden"
								>
									<QueryPanel node={node} />
								</Tabs.Content>
								<Tabs.Content
									value="settings"
									className="flex-1 flex flex-col overflow-y-auto px-[4px] outline-none"
								>
									<SettingsPanel node={node} />
								</Tabs.Content>
							</Tabs.Root>
						</PropertiesPanelContent>
					</Panel>
					<PanelResizeHandle className="h-[12px] flex items-center justify-center cursor-row-resize">
						<ResizeHandle direction="vertical" />
					</PanelResizeHandle>
					<Panel>
						<PropertiesPanelContent>
							<GenerationPanel node={node} onClickGenerateButton={generate} />
						</PropertiesPanelContent>
					</Panel>
				</PanelGroup>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
