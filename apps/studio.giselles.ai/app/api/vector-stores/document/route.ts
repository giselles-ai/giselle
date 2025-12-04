import { NextResponse } from "next/server";

import {
	getDocumentVectorStores,
	getOfficialDocumentVectorStores,
} from "@/lib/vector-stores/document/queries";

export async function GET() {
	try {
		const [stores, officialStores] = await Promise.all([
			getDocumentVectorStores(),
			getOfficialDocumentVectorStores(),
		]);

		const formatStore = (
			store: (typeof stores)[number],
			isOfficial: boolean,
		) => ({
			id: store.id,
			name: store.name,
			embeddingProfileIds: store.embeddingProfileIds,
			sources: store.sources.map((source) => ({
				id: source.id,
				fileName: source.fileName,
				ingestStatus: source.ingestStatus,
				ingestErrorCode: source.ingestErrorCode,
			})),
			isOfficial,
		});

		// Deduplicate: exclude official stores that are already in user's stores
		const officialStoreIds = new Set(officialStores.map((s) => s.id));
		const userStoreIds = new Set(stores.map((s) => s.id));
		const mergedStores = [
			...stores.map((store) =>
				formatStore(store, officialStoreIds.has(store.id)),
			),
			...officialStores
				.filter((store) => !userStoreIds.has(store.id))
				.map((store) => formatStore(store, true)),
		];

		return NextResponse.json(
			{ documentVectorStores: mergedStores },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Failed to fetch document vector stores:", error);
		return NextResponse.json(
			{ error: "Failed to fetch document vector stores" },
			{ status: 500 },
		);
	}
}
