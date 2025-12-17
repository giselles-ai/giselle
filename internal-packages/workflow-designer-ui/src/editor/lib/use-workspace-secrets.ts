import useSWR from "swr";
import { useAppDesignerStore } from "../../app-designer";
import { useGiselle } from "../../app-designer/store/giselle-client-provider";
export function useWorkspaceSecrets(tags?: string[]) {
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const client = useGiselle();
	return useSWR(
		{
			namespace: "get-workspace-secrets",
			workspaceId,
			tags: tags ?? [],
		},
		({ workspaceId, tags }) =>
			client
				.getWorkspaceSecrets({ workspaceId, tags })
				.then((res) => res.secrets),
	);
}
