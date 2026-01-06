import { notFound } from "next/navigation";
import { apiPublishingFlag } from "../../../../../flags";
import { ApiKeysPageClient } from "./page-client";

export default async function ApiKeysPage() {
	const isApiPublishingEnabled = await apiPublishingFlag();
	if (!isApiPublishingEnabled) {
		notFound();
	}
	return <ApiKeysPageClient />;
}
