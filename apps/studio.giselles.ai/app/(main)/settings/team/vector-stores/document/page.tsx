import { DocsLink } from "@giselle-internal/ui/docs-link";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import { fetchCurrentTeam } from "@/services/teams";
import { getDocumentVectorStoreQuota } from "@/services/teams/plan-features/document-vector-store";
import {
	createDocumentVectorStore,
	deleteDocumentVectorStore,
	updateDocumentVectorStore,
} from "../actions";
import { getDocumentVectorStores } from "../data";
import { DocumentVectorStoreCreateDialog } from "../document-store-create-dialog";
import { DocumentVectorStoreList } from "../document-vector-store-list";

export default async function DocumentVectorStorePage() {
	const [vectorStores, team] = await Promise.all([
		getDocumentVectorStores(),
		fetchCurrentTeam(),
	]);
	const quota = getDocumentVectorStoreQuota(team.plan);
	const usageCount = vectorStores.length;
	const hasAccess = quota.isAvailable;
	const hasReachedLimit = hasAccess && usageCount >= quota.maxStores;
	const createDisabled = !hasAccess || hasReachedLimit;
	const createDisabledReason = !hasAccess
		? "Document Vector Stores are available on Pro or Team plans."
		: hasReachedLimit
			? "You've reached the number of Document Vector Stores included in your plan."
			: undefined;

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<PageHeading glow>Vector Stores</PageHeading>
				<div className="flex items-center gap-4">
					<DocsLink
						href="https://docs.giselles.ai/en/guides/settings/team/vector-stores"
						target="_blank"
						rel="noopener noreferrer"
					>
						About Vector Stores
					</DocsLink>
					<DocumentVectorStoreCreateDialog
						createAction={createDocumentVectorStore}
						disabled={createDisabled}
						disabledReason={createDisabledReason}
					/>
				</div>
			</div>
			<DocumentVectorStoreList
				stores={vectorStores}
				deleteAction={deleteDocumentVectorStore}
				updateAction={updateDocumentVectorStore}
				hasAccess={hasAccess}
				maxStores={quota.maxStores}
				teamPlan={team.plan}
			/>
		</div>
	);
}
