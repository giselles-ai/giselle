import {
	WorkspaceGitHubIntegrationId,
	WorkspaceGitHubIntegrationSetting,
} from "@giselle-sdk/data-type";
import { useGiselleEngine, useWorkflowDesigner } from "giselle-sdk/react";
import { type FormEvent, useCallback, useEffect, useState } from "react";

export function useGitHubIntegrationSetting() {
	const { data: workspace } = useWorkflowDesigner();
	const client = useGiselleEngine();
	const [setting, setSetting] = useState<
		WorkspaceGitHubIntegrationSetting | undefined
	>();
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);

	useEffect(() => {
		client
			.getWorkspaceGitHubIntegrationSetting({ workspaceId: workspace.id })
			.then(({ workspaceGitHubIntegrationSetting }) => {
				setSetting(workspaceGitHubIntegrationSetting);
				setIsLoading(false);
			})
			.catch((err) => {
				console.error("Failed to load GitHub integration settings:", err);
				setIsLoading(false);
			});
	}, [client, workspace.id]);

	const handleSubmit = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			setIsSaving(true);
			setSaveSuccess(null);

			try {
				const id = setting?.id ?? WorkspaceGitHubIntegrationId.generate();
				const formData = new FormData(event.currentTarget);
				const workspaceGitHubIntegrationSetting =
					WorkspaceGitHubIntegrationSetting.parse({
						id,
						workspaceId: workspace.id,
						repositoryNodeId: formData.get("repositoryNodeId") as string,
						callsign: formData.get("callsign") as string,
						event: formData.get("event") as string,
						payloadMaps: JSON.parse(formData.get("payloadMaps") as string),
						nextAction: formData.get("nextAction") as string,
						nextActionPayloadMapId: formData.get("nextAction") as string,
					});

				await client.upsertWorkspaceGitHubIntegrationSetting({
					workspaceGitHubIntegrationSetting,
				});

				setSetting(workspaceGitHubIntegrationSetting);
				setSaveSuccess(true);
			} catch (err) {
				console.error("Failed to save GitHub integration settings:", err);
				setSaveSuccess(false);
			} finally {
				setIsSaving(false);
			}
		},
		[client, workspace.id, setting],
	);

	return {
		isLoading,
		isSaving,
		saveSuccess,
		data: setting,
		handleSubmit,
	};
}
