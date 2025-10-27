import {
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import useSWR from "swr";
export function useWorkspaceSecrets(tags?: string[]) {
	const { data } = useWorkflowDesigner();
	const client = useGiselleEngine();
	return useSWR(
		{
			namespace: "get-workspace-secrets",
			workspaceId: data.id,
			tags: tags ?? [],
		},
		({ workspaceId, tags }) =>
			client
				.getWorkspaceSecrets({ workspaceId, tags })
				.then((res) => res.secrets),
	);
}
