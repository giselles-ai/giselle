import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { docVectorStoreFlag } from "@/flags";
import { createDocumentVectorStore } from "../actions";
import type { DocumentVectorStore } from "../data";
import { getDocumentVectorStores } from "../data";
import { DocumentVectorStoreCreateDialog } from "../document-store-create-dialog";
import { DocumentVectorStoreList } from "../document-vector-store-list";
import { VectorStoresNavigationLayout } from "../navigation-layout";

export default async function DocumentVectorStorePage() {
	const enabled = await docVectorStoreFlag();
	if (!enabled) {
		return notFound();
	}

	let vectorStores: DocumentVectorStore[] = [];
	try {
		vectorStores = await getDocumentVectorStores();
	} catch (_err) {
		throw new Error("Could not load vector stores. Please try again later.");
	}

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<h1
					className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
					style={{
						textShadow: "0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
					}}
				>
					Vector Stores
				</h1>
				<div className="flex items-center gap-4">
					<a
						href="https://docs.giselles.ai/guides/settings/team/vector-store"
						target="_blank"
						rel="noopener noreferrer"
						className="text-black-300 text-[14px] font-medium rounded-[4px] px-1.5 py-0.5 hover:bg-black-300/10 flex items-center gap-1.5 font-sans"
					>
						About Vector Stores
						<ExternalLink size={14} />
					</a>
					<DocumentVectorStoreCreateDialog
						createAction={createDocumentVectorStore}
					/>
				</div>
			</div>
			<VectorStoresNavigationLayout isEnabled={enabled}>
				<DocumentVectorStoreList stores={vectorStores} />
			</VectorStoresNavigationLayout>
		</div>
	);
}
