import { NextResponse } from "next/server";

import {
	getDocumentVectorStores,
	getPublicDocumentVectorStores,
} from "@/lib/vector-stores/document/queries";

export async function GET() {
	try {
		const [stores, publicStores] = await Promise.all([
			getDocumentVectorStores(),
			getPublicDocumentVectorStores(),
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

		// Deduplicate: exclude public stores that are already in user's stores
		const publicStoreIds = new Set(publicStores.map((s) => s.id));
		const userStoreIds = new Set(stores.map((s) => s.id));
		const mergedStores = [
			...stores.map((store) =>
				formatStore(store, publicStoreIds.has(store.id)),
			),
			...publicStores
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
