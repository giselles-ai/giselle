import type { DataStoreItem } from "@giselles-ai/react";
import useSWR from "swr";

type UseDataStoresOptions = {
	fallbackStores: DataStoreItem[];
	fetcher: () => Promise<DataStoreItem[]>;
};

export function useDataStores({
	fallbackStores,
	fetcher,
}: UseDataStoresOptions) {
	const swr = useSWR<DataStoreItem[]>("data-stores", fetcher, {
		fallbackData: fallbackStores,
	});

	return {
		...swr,
		stores: swr.data ?? fallbackStores,
	};
}
