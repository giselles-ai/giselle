import { EmptyState } from "@giselle-internal/ui/empty-state";
import { SectionHeader } from "@giselle-internal/ui/section-header";
import { Card } from "@/components/ui/card";
import type { DocumentVectorStoreId } from "@/packages/types";
import type { DocumentVectorStoreWithProfiles } from "./data";
import { DocumentVectorStoreItem } from "./document/document-vector-store-item";
import type { ActionResult, DocumentVectorStoreUpdateInput } from "./types";

type DocumentVectorStoreListProps = {
	stores: DocumentVectorStoreWithProfiles[];
	deleteAction: (
		documentVectorStoreId: DocumentVectorStoreId,
	) => Promise<ActionResult>;
	updateAction: (
		documentVectorStoreId: DocumentVectorStoreId,
		input: DocumentVectorStoreUpdateInput,
	) => Promise<ActionResult>;
};

export function DocumentVectorStoreList({
	stores,
	deleteAction,
	updateAction,
}: DocumentVectorStoreListProps) {
	return (
		<div className="flex flex-col gap-y-[16px]">
			<Card className="rounded-[8px] bg-transparent p-6 border-0">
				<SectionHeader
					title="Document Vector Stores"
					description="Manage the vector stores configured for document ingestion."
					className="mb-4"
				/>

				{stores.length > 0 ? (
					<div className="space-y-4">
						{stores.map((store) => (
							<DocumentVectorStoreItem
								key={store.id}
								store={store}
								deleteAction={deleteAction}
								updateAction={updateAction}
							/>
						))}
					</div>
				) : (
					<EmptyDocumentVectorStoreCard />
				)}
			</Card>
		</div>
	);
}

function EmptyDocumentVectorStoreCard() {
	return (
		<div className="text-center py-16 bg-surface rounded-lg">
			<EmptyState
				title="No document vector stores yet."
				description='Use the "New Vector Store" button to create one.'
			/>
		</div>
	);
}
