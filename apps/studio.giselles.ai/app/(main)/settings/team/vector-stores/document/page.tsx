import { DocsLink } from "@giselle-internal/ui/docs-link";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import { notFound } from "next/navigation";
import { docVectorStoreFlag } from "@/flags";
import {
	createDocumentVectorStore,
	deleteDocumentVectorStore,
	updateDocumentVectorStore,
} from "../actions";
import { getDocumentVectorStores } from "../data";
import { DocumentVectorStoreCreateDialog } from "../document-store-create-dialog";
import { DocumentVectorStoreList } from "../document-vector-store-list";
import { VectorStoresNavigationLayout } from "../navigation-layout";

export default async function DocumentVectorStorePage() {
	const enabled = await docVectorStoreFlag();
	if (!enabled) {
		return notFound();
	}

	const vectorStores = await getDocumentVectorStores();

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<PageHeading glow>Vector Stores</PageHeading>
				<div className="flex items-center gap-4">
					<DocsLink href="https://docs.giselles.ai/guides/settings/team/vector-store">
						About Vector Stores
					</DocsLink>
					<DocumentVectorStoreCreateDialog
						createAction={createDocumentVectorStore}
					/>
				</div>
			</div>
			<VectorStoresNavigationLayout isEnabled={enabled}>
				<DocumentVectorStoreList
					stores={vectorStores}
					deleteAction={deleteDocumentVectorStore}
					updateAction={updateDocumentVectorStore}
				/>
			</VectorStoresNavigationLayout>
		</div>
	);
}
