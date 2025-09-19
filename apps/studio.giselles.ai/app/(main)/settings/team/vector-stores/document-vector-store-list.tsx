import { Card } from "@/components/ui/card";
import type { DocumentVectorStore } from "./data";

type DocumentVectorStoreListProps = {
	stores: DocumentVectorStore[];
};

export function DocumentVectorStoreList({
	stores,
}: DocumentVectorStoreListProps) {
	return (
		<div className="flex flex-col gap-y-[16px]">
			<Card className="rounded-[8px] bg-transparent p-6 border-0">
				<div className="flex items-center mb-4">
					<div>
						<h4 className="text-white-400 font-medium text-[18px] leading-[21.6px] font-sans">
							Document Vector Stores
						</h4>
						<p className="text-black-400 text-[14px] leading-[20.4px] font-geist mt-1">
							Manage the vector stores configured for document ingestion.
						</p>
					</div>
				</div>

				{stores.length > 0 ? (
					<div className="space-y-4">
						{stores.map((store) => (
							<DocumentVectorStoreItem key={store.id} store={store} />
						))}
					</div>
				) : (
					<EmptyDocumentVectorStoreCard />
				)}
			</Card>
		</div>
	);
}

type DocumentVectorStoreItemProps = {
	store: DocumentVectorStore;
};

function DocumentVectorStoreItem({ store }: DocumentVectorStoreItemProps) {
	return (
		<div className="group relative rounded-[12px] overflow-hidden w-full bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none hover:border-white/12 transition-colors duration-200">
			<div className="px-[24px] py-[16px]">
				<div className="flex items-start justify-between gap-4 mb-4">
					<div>
						<h5 className="text-white-400 font-medium text-[16px] leading-[22.4px] font-sans">
							{store.name}
						</h5>
						<div className="text-black-300 text-[13px] leading-[18px] font-geist mt-1">
							ID: {store.id}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function EmptyDocumentVectorStoreCard() {
	return (
		<div className="text-black-300 text-center py-16 bg-black-300/10 rounded-lg">
			<div>No document vector stores yet.</div>
			<div>Use the "New Vector Store" button to create one.</div>
		</div>
	);
}
