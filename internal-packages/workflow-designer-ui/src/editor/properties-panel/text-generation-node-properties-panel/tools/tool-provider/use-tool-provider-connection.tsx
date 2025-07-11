import {
	SecretId,
	type TextGenerationNode,
	type ToolSet,
} from "@giselle-sdk/data-type";
import {
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
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
}) {
	const { secretTags, toolKey, node, buildToolConfig } = config;
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
						mutate([...(data ?? []), result.secret]);
						updateNodeDataContent(node, {
							...node.content,
							tools: {
								...node.content.tools,
								[toolKey]: buildToolConfig(result.secret.id),
							},
						});
					});
					break;
				case "select":
					updateNodeDataContent(node, {
						...node.content,
						tools: {
							...node.content.tools,
							[toolKey]: buildToolConfig(payload.secretId),
						},
					});
					break;
				default: {
					const _exhaustiveCheck: never = payload;
					throw new Error(`Unhandled secretType: ${_exhaustiveCheck}`);
				}
			}
		},
		[
			node,
			updateNodeDataContent,
			client,
			workspace.id,
			data,
			mutate,
			secretTags,
			toolKey,
			buildToolConfig,
		],
	);

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
	} as const;
}
