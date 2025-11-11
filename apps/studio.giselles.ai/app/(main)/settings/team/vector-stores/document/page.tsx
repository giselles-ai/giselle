import {
	createDocumentVectorStore,
	deleteDocumentVectorStore,
	updateDocumentVectorStore,
} from "../actions";
import { getDocumentVectorStores } from "../data";
import { DocumentVectorStoreCreateDialog } from "../document-store-create-dialog";
import { DocumentVectorStoreList } from "../document-vector-store-list";

export default async function DocumentVectorStorePage() {
	const vectorStores = await getDocumentVectorStores();

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-end">
				<DocumentVectorStoreCreateDialog
					createAction={createDocumentVectorStore}
				/>
			</div>
			<DocumentVectorStoreList
				stores={vectorStores}
				deleteAction={deleteDocumentVectorStore}
				updateAction={updateDocumentVectorStore}
			/>
		</div>
	);
}
