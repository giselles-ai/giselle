import { notFound, redirect } from "next/navigation";
import { apiPublishingFlag } from "../../../../flags";

export default async function ApiKeysPage() {
	const isApiPublishingEnabled = await apiPublishingFlag();
	if (!isApiPublishingEnabled) {
		notFound();
	}
	redirect("/settings/team/api-keys");
}
