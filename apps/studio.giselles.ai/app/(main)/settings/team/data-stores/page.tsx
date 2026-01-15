import { notFound } from "next/navigation";
import { dataStoreFlag } from "@/flags";
import { getDataStores } from "./actions";
import { DataStoresPageClient } from "./page-client";

export default async function DataStoresPage() {
	const isDataStoreEnabled = await dataStoreFlag();
	if (!isDataStoreEnabled) {
		notFound();
	}

	const dataStores = await getDataStores();

	return <DataStoresPageClient dataStores={dataStores} />;
}
