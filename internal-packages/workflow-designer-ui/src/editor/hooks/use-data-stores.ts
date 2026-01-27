import type { WorkspaceId } from "@giselles-ai/protocol";
import type { DataStoreItem } from "@giselles-ai/react";
import useSWR from "swr";

type UseDataStoresOptions = {
	workspaceId: WorkspaceId;
	fallbackStores: DataStoreItem[];
	fetcher: () => Promise<DataStoreItem[]>;
};

export function useDataStores({
	workspaceId,
	fallbackStores,
	fetcher,
}: UseDataStoresOptions) {
	const swr = useSWR<DataStoreItem[]>(["data-stores", workspaceId], fetcher, {
		fallbackData: fallbackStores,
	});

	return {
		...swr,
		stores: swr.data ?? fallbackStores,
	};
}
