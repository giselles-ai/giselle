import { fetchCurrentTeam } from "@/services/teams";
import { getDocumentVectorStoreQuota } from "@/services/teams/plan-features/document-vector-store";
import {
	createDocumentVectorStore,
	deleteDocumentVectorStore,
	updateDocumentVectorStore,
} from "../actions";
import {
	getDocumentVectorStores,
	getPublicDocumentVectorStores,
} from "../data";
import { DocumentVectorStoreCreateDialog } from "../document-store-create-dialog";
import { DocumentVectorStoreList } from "../document-vector-store-list";

export default async function DocumentVectorStorePage() {
	const [vectorStores, officialStores, team] = await Promise.all([
		getDocumentVectorStores(),
		getPublicDocumentVectorStores(),
		fetchCurrentTeam(),
	]);
	const quota = getDocumentVectorStoreQuota(team.plan);
	const usageCount = vectorStores.length;
	const hasAccess = quota.isAvailable;
	const hasReachedLimit = hasAccess && usageCount >= quota.maxStores;
	const createDisabled = !hasAccess || hasReachedLimit;
	const createDisabledReason = !hasAccess
		? "Document Vector Stores are only available with the Pro or Team plans."
		: hasReachedLimit
			? "You've reached the maximum number of Document Vector Stores included in your plan."
			: undefined;

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-end">
				<DocumentVectorStoreCreateDialog
					createAction={createDocumentVectorStore}
					disabled={createDisabled}
					disabledReason={createDisabledReason}
				/>
			</div>
			<DocumentVectorStoreList
				stores={vectorStores}
				officialStores={officialStores}
				deleteAction={deleteDocumentVectorStore}
				updateAction={updateDocumentVectorStore}
				hasAccess={hasAccess}
				maxStores={quota.maxStores}
				teamPlan={team.plan}
			/>
		</div>
	);
}
