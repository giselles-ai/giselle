import { defaultName } from "@giselles-ai/node-registry";
import type { EndNode, NodeId, NodeLike } from "@giselles-ai/protocol";
import { useState } from "react";
import {
	useAppDesignerStore,
	useUpdateNodeDataContent,
} from "../../../app-designer";
import { StructuredOutputDialog } from "../text-generation-node-properties-panel/structured-output-dialog";
import { SettingDetail } from "../ui/setting-label";

function buildSuggestionsAndVariables(connectedNodes: NodeLike[]): {
	suggestions: { label: string; apply: string }[];
	variables: Record<string, string>;
} {
	const suggestions: { label: string; apply: string }[] = [];
	const variables: Record<string, string> = {};

	for (const node of connectedNodes) {
		if (node.type !== "operation") continue;

		const content = node.content as Record<string, unknown>;
		if (typeof content.outputSchema !== "string") continue;

		const nodeName = node.name ?? defaultName(node);
		const label = `${nodeName} / Schema`;
		suggestions.push({ label, apply: `{{${label}}}` });
		variables[label] = content.outputSchema;
	}

	return { suggestions, variables };
}

export function EndNodeOutputFormat({ node }: { node: EndNode }) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const updateNodeDataContent = useUpdateNodeDataContent();
	const { nodes, connections } = useAppDesignerStore((s) => ({
		nodes: s.nodes,
		connections: s.connections,
	}));

	const nodeById = new Map(nodes.map((n) => [n.id, n] as const));
	const connectedNodeIds = new Set<NodeId>();

	for (const connection of connections) {
		if (connection.inputNode.id === node.id) {
			connectedNodeIds.add(connection.outputNode.id);
		}
	}

	const connectedUpstreamNodes = [...connectedNodeIds]
		.map((id) => nodeById.get(id))
		.filter((n): n is NodeLike => n !== undefined);

	const { suggestions, variables } = buildSuggestionsAndVariables(
		connectedUpstreamNodes,
	);

	const defaultSchema = (() => {
		const entries: string[] = [];
		for (const upstreamNode of connectedUpstreamNodes) {
			if (upstreamNode.type !== "operation") continue;
			const content = upstreamNode.content as Record<string, unknown>;
			if (typeof content.outputSchema !== "string") continue;
			const nodeName = upstreamNode.name ?? defaultName(upstreamNode);
			entries.push(`    {{${nodeName} / Schema}}`);
		}
		const props = entries.join(",\n");
		return `{\n  "type": "object",\n  "properties": {\n${props}\n  }\n}`;
	})();

	return (
		<div>
			<SettingDetail className="mb-[6px]">Structured Output</SettingDetail>
			<button
				type="button"
				onClick={() => setIsDialogOpen(true)}
				className="w-full rounded-[8px] border border-white/10 bg-white/5 px-[12px] py-[8px] text-[13px] text-inverse/80 hover:text-inverse hover:bg-white/10 transition-colors text-left"
			>
				{node.content.outputSchema
					? "Edit Structured Output"
					: "Set Structured Output"}
			</button>
			{node.content.outputSchema && (
				<pre className="mt-[4px] rounded-[6px] bg-black/20 p-[8px] text-[11px] text-text/50 font-mono overflow-auto max-h-[100px]">
					{node.content.outputSchema}
				</pre>
			)}
			<StructuredOutputDialog
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				title="End Node — Structured Output"
				description={
					<>
						Define a JSON Schema for the app output. Use{" "}
						<strong>@</strong> to reference upstream node schemas.
					</>
				}
				initialSchema={node.content.outputSchema ?? defaultSchema}
				onSave={(value) => {
					updateNodeDataContent(node, { outputSchema: value });
				}}
				suggestions={suggestions}
				variables={variables}
				showPreview={true}
			/>
		</div>
	);
}
