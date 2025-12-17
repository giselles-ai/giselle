import { useCallback } from "react";
import { useGiselle } from "../giselle-client-provider";
import { useAppDesignerStore } from "../hooks";

export function useAddSecret() {
	const client = useGiselle();
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);

	return useCallback(
		async (args: { label: string; value: string }) => {
			return await client.addSecret({
				workspaceId,
				label: args.label,
				value: args.value,
			});
		},
		[client, workspaceId],
	);
}
