import {
	SecretId,
	type TextGenerationNode,
	type ToolSet,
} from "@giselle-sdk/data-type";
import {
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import { useCallback, useMemo, useState, useTransition } from "react";
import z from "zod/v4";
import { useWorkspaceSecrets } from "../../../../lib/use-workspace-secrets";

export const ToolProviderSecretTypeValue = z.enum(["create", "select"]);

const ToolProviderSetupPayload = z.discriminatedUnion("secretType", [
	z.object({
		secretType: z.literal(ToolProviderSecretTypeValue.enum.create),
		label: z.string().min(1),
		value: z.string().min(1),
	}),
	z.object({
		secretType: z.literal(ToolProviderSecretTypeValue.enum.select),
		secretId: SecretId.schema,
	}),
]);

export function useToolProviderConnection<T extends keyof ToolSet>(config: {
	secretTags: string[];
	toolKey: T;
	node: TextGenerationNode;
	buildToolConfig: (secretId: SecretId) => ToolSet[T];
	isUpdatingExistingConfiguration?: boolean;
}) {
	const {
		secretTags,
		toolKey,
		node,
		buildToolConfig,
		isUpdatingExistingConfiguration = false,
	} = config;
	const [presentDialog, setPresentDialog] = useState(false);
	const [tabValue, setTabValue] = useState<"create" | "select">("create");
	const { updateNodeDataContent, data: workspace } = useWorkflowDesigner();
	const { isLoading, data, mutate } = useWorkspaceSecrets(secretTags);
	const client = useGiselleEngine();
	const [isPending, startTransition] = useTransition();

	const isConfigured = useMemo(
		() => node.content.tools?.[toolKey] !== undefined,
		[node, toolKey],
	);

	const preserveExistingToolSelections = useCallback(
		(secretId: SecretId) => {
			const currentTool = node.content.tools?.[toolKey];
			const currentToolSettings =
				currentTool && "tools" in currentTool ? currentTool.tools : [];

			const newToolConfig = buildToolConfig(secretId);
			return {
				...newToolConfig,
				tools: currentToolSettings,
			};
		},
		[node, toolKey, buildToolConfig],
	);

	const updateNodeWithToolConfig = useCallback(
		(secretId: SecretId) => {
			const toolConfig = isUpdatingExistingConfiguration
				? preserveExistingToolSelections(secretId)
				: buildToolConfig(secretId);

			updateNodeDataContent(node, {
				...node.content,
				tools: {
					...node.content.tools,
					[toolKey]: toolConfig,
				},
			});
		},
		[
			isUpdatingExistingConfiguration,
			preserveExistingToolSelections,
			buildToolConfig,
			updateNodeDataContent,
			node,
			toolKey,
		],
	);

	const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			const formData = new FormData(e.currentTarget);
			const secretType = formData.get("secretType");
			const label = formData.get("label");
			const value = formData.get("value");
			const secretId = formData.get("secretId");
			const parse = ToolProviderSetupPayload.safeParse({
				secretType,
				label,
				value,
				secretId,
			});
			if (!parse.success) {
				/** @todo Implement error handling */
				console.log(parse.error);
				return;
			}
			const payload = parse.data;
			switch (payload.secretType) {
				case "create":
					startTransition(async () => {
						const result = await client.addSecret({
							workspaceId: workspace.id,
							label: payload.label,
							value: payload.value,
							tags: secretTags,
						});
						// Update cache immediately with new secret (optimistic)
						mutate([...(data ?? []), result.secret], false);
						// Now safe to update node (secret exists in cache)
						updateNodeWithToolConfig(result.secret.id);
					});
					break;
				case "select":
					updateNodeWithToolConfig(payload.secretId);
					break;
				default: {
					const _exhaustiveCheck: never = payload;
					throw new Error(`Unhandled secretType: ${_exhaustiveCheck}`);
				}
			}
		},
		[client, workspace.id, data, mutate, secretTags, updateNodeWithToolConfig],
	);

	const currentSecretId = useMemo(() => {
		const tool = node.content.tools?.[toolKey];
		if (!tool) return undefined;

		if ("auth" in tool && tool.auth?.type === "secret") {
			return tool.auth.secretId;
		}
		if ("secretId" in tool) {
			return tool.secretId;
		}

		return undefined;
	}, [node, toolKey]);

	return {
		presentDialog,
		setPresentDialog,
		tabValue,
		setTabValue,
		isPending,
		isConfigured,
		isLoading,
		secrets: data,
		handleSubmit,
		currentSecretId,
	} as const;
}
