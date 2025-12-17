import {
	isTextGenerationNode,
	type SecretId,
	type TextGenerationNode,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useGiselle } from "../giselle-client-provider";
import { useAppDesignerStore } from "../hooks";
import { useUpdateNodeDataContent } from "./use-update-node-data-content";

export function useDeleteSecretAndCleanupNodes() {
	const client = useGiselle();
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const store = useAppDesignerStoreApi();
	const updateNodeDataContent = useUpdateNodeDataContent();

	return useCallback(
		async (secretId: SecretId) => {
			const { nodes } = store.getState();
			for (const node of nodes) {
				if (!isTextGenerationNode(node)) continue;
				const tools = node.content.tools;
				if (!tools) continue;

				let changed = false;
				const newTools = { ...tools };
				if (
					tools.github?.auth.type === "secret" &&
					tools.github.auth.secretId === secretId
				) {
					newTools.github = undefined;
					changed = true;
				}
				if (tools.postgres?.secretId === secretId) {
					newTools.postgres = undefined;
					changed = true;
				}
				if (changed) {
					updateNodeDataContent<TextGenerationNode>(node, { tools: newTools });
				}
			}

			await client.deleteSecret({
				workspaceId,
				secretId,
			});
		},
		[client, store, updateNodeDataContent, workspaceId],
	);
}
