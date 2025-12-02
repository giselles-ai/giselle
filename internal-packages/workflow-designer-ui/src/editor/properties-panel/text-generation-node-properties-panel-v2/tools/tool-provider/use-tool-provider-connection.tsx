import {
	type LanguageModelToolName,
	languageModelTools,
} from "@giselles-ai/language-model-registry";
import { type ContentGenerationNode, SecretId } from "@giselles-ai/protocol";
import { useGiselle, useWorkflowDesigner } from "@giselles-ai/react";
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

export function useToolProviderConnection<
	T extends LanguageModelToolName,
>(config: { secretTags: string[]; toolName: T; node: ContentGenerationNode }) {
	const { secretTags, toolName, node } = config;
	const [presentDialog, setPresentDialog] = useState(false);
	const [tabValue, setTabValue] = useState<"create" | "select">("create");
	const { updateNodeDataContent, data: workspace } = useWorkflowDesigner();
	const { isLoading, data, mutate } = useWorkspaceSecrets(secretTags);
	const client = useGiselle();
	const [isPending, startTransition] = useTransition();

	const isConfigured = useMemo(
		() => node.content.tools.some((tool) => tool.name === toolName),
		[node, toolName],
	);

	const languageModelTool = useMemo(() => {
		const result = languageModelTools.find((tool) => tool.name === toolName);
		if (result === undefined) {
			throw new Error(`Language model tool with name ${toolName} not found`);
		}
		return result;
	}, [toolName]);

	const upsertToolSecret = useCallback(
		(secretId: SecretId) => {
			if ("secretId" in languageModelTool.configurationOptions) {
				if (isConfigured) {
					updateNodeDataContent(node, {
						...node.content,
						tools: node.content.tools.map((tool) =>
							tool.name === toolName
								? {
										...tool,
										configuration: {
											...tool.configuration,
											secretId,
										},
									}
								: tool,
						),
					});
				} else {
					updateNodeDataContent(node, {
						...node.content,
						tools: [
							...node.content.tools,
							{
								name: toolName,
								configuration: {
									secretId,
									useTools: [],
								},
							},
						],
					});
				}
			}
		},
		[isConfigured, languageModelTool, updateNodeDataContent, node, toolName],
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
						upsertToolSecret(result.secret.id);
					});
					break;
				case "select":
					upsertToolSecret(payload.secretId);
					break;
				default: {
					const _exhaustiveCheck: never = payload;
					throw new Error(`Unhandled secretType: ${_exhaustiveCheck}`);
				}
			}
		},
		[client, workspace.id, data, mutate, secretTags, upsertToolSecret],
	);

	const currentSecretId = useMemo(() => {
		const tool = node.content.tools.find((tool) => tool.name === toolName);
		if (!tool) return undefined;

		if ("secretId" in tool && tool.configuration) {
			const result = SecretId.safeParse(tool.secretId);
			if (result.error) {
				return undefined;
			}
			return result.data;
		}
		return undefined;
	}, [node, toolName]);

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
