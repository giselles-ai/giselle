import { getDataStores } from "./actions";
import { DataStoresPageClient } from "./page-client";

export default async function DataStoresPage() {
	const dataStores = await getDataStores();

	return <DataStoresPageClient dataStores={dataStores} />;
}
