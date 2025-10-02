import { NextResponse } from "next/server";

import { docVectorStoreFlag } from "@/flags";
import { getDocumentVectorStores } from "@/lib/vector-stores/document/queries";

export async function GET() {
	const enabled = await docVectorStoreFlag();
	if (!enabled) {
		return NextResponse.json({ error: "Not Found" }, { status: 404 });
	}

	try {
		const stores = await getDocumentVectorStores();
		return NextResponse.json(
			{
				documentVectorStores: stores.map((store) => ({
					id: store.id,
					name: store.name,
					embeddingProfileIds: store.embeddingProfileIds,
					sources: store.sources.map((source) => ({
						id: source.id,
						fileName: source.fileName,
						ingestStatus: source.ingestStatus,
						ingestErrorCode: source.ingestErrorCode,
					})),
				})),
			},
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
