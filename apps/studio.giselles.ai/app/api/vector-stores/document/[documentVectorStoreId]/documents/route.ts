import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import { createId } from "@paralleldrive/cuid2";
import { createClient } from "@supabase/supabase-js";
import { and, eq, inArray } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
	db,
	documentVectorStoreSources,
	documentVectorStores,
} from "@/drizzle";
import { docVectorStoreFlag } from "@/flags";
import {
	DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_BYTES,
	DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_MB,
	DOCUMENT_VECTOR_STORE_SUPPORTED_FILE_TYPE_LABEL,
} from "@/lib/vector-stores/document/constants";
import { ingestDocument } from "@/lib/vector-stores/document/ingest";
import {
	resolveSupportedDocumentFile,
	sanitizeDocumentFileName,
} from "@/lib/vector-stores/document/utils";
import type {
	DocumentVectorStoreId,
	DocumentVectorStoreSourceId,
} from "@/packages/types";
import { fetchCurrentTeam } from "@/services/teams";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const STORAGE_BUCKET =
	process.env.DOCUMENT_VECTOR_STORE_STORAGE_BUCKET ?? "app";
const STORAGE_PREFIX = "vector-stores";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	throw new Error(
		"Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.",
	);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function ensureFeatureEnabled() {
	const enabled = await docVectorStoreFlag();
	if (!enabled) {
		return NextResponse.json({ error: "Not Found" }, { status: 404 });
	}
	return null;
}

async function fetchTeam() {
	try {
		return await fetchCurrentTeam();
	} catch (_error) {
		return null;
	}
}

async function findAccessibleStore(
	documentVectorStoreId: DocumentVectorStoreId,
	teamDbId: number,
) {
	const [store] = await db
		.select({
			dbId: documentVectorStores.dbId,
			id: documentVectorStores.id,
		})
		.from(documentVectorStores)
		.where(
			and(
				eq(documentVectorStores.id, documentVectorStoreId),
				eq(documentVectorStores.teamDbId, teamDbId),
			),
		)
		.limit(1);

	return store ?? null;
}

async function rollbackUploads(
	uploadedKeys: string[],
	createdSourceIds: DocumentVectorStoreSourceId[],
) {
	if (uploadedKeys.length > 0) {
		try {
			const { error: storageError } = await supabase.storage
				.from(STORAGE_BUCKET)
				.remove(uploadedKeys);

			if (storageError) {
				console.error(
					"Failed to roll back uploaded document files from storage. Aborting rollback.",
					storageError,
				);
				throw new Error("Storage cleanup failed during rollback.");
			}
		} catch (cleanupError) {
			console.error(
				"Failed to roll back uploaded document files from storage. Aborting rollback.",
				cleanupError,
			);
			throw cleanupError instanceof Error
				? cleanupError
				: new Error("Storage cleanup failed during rollback.");
		}
	}

	if (createdSourceIds.length > 0) {
		try {
			await db
				.delete(documentVectorStoreSources)
				.where(inArray(documentVectorStoreSources.id, createdSourceIds));
		} catch (cleanupError) {
			console.error(
				"Failed to roll back document vector store source records:",
				cleanupError,
			);
			throw cleanupError instanceof Error
				? cleanupError
				: new Error("Database cleanup failed during rollback.");
		}
	}
}

function buildStorageKey(
	documentVectorStoreId: DocumentVectorStoreId,
	fileName: string,
) {
	return `${STORAGE_PREFIX}/${documentVectorStoreId}/${createId()}/${fileName}`;
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ documentVectorStoreId: string }> },
) {
	const featureGuard = await ensureFeatureEnabled();
	if (featureGuard) {
		return featureGuard;
	}

	const team = await fetchTeam();
	if (!team) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const formData = await request.formData();
	const files = formData
		.getAll("files")
		.filter((item): item is File => item instanceof File);

	if (files.length === 0) {
		return NextResponse.json({ error: "No files provided" }, { status: 400 });
	}

	const { documentVectorStoreId: documentVectorStoreIdParam } = await params;
	const documentVectorStoreId =
		documentVectorStoreIdParam as DocumentVectorStoreId;
	const store = await findAccessibleStore(documentVectorStoreId, team.dbId);
	if (!store) {
		return NextResponse.json(
			{ error: "Vector store not found" },
			{ status: 404 },
		);
	}

	const successes: Array<{
		fileName: string;
		sourceId: DocumentVectorStoreSourceId;
		storageKey: string;
	}> = [];
	const failures: Array<{
		fileName: string;
		error: string;
		code:
			| "unsupported-type"
			| "empty"
			| "oversize"
			| "read-error"
			| "upload-error"
			| "metadata-error"
			| "rollback-error";
	}> = [];

	for (const file of files) {
		const trimmedFileName = file.name.trim();
		const resolvedFile = resolveSupportedDocumentFile(file);
		const fallbackFileName = trimmedFileName || file.name || "document";

		if (!resolvedFile) {
			failures.push({
				fileName: fallbackFileName,
				error: `Unsupported file type. Supported types: ${DOCUMENT_VECTOR_STORE_SUPPORTED_FILE_TYPE_LABEL}`,
				code: "unsupported-type",
			});
			continue;
		}

		const sanitizedFileName = sanitizeDocumentFileName(
			fallbackFileName,
			resolvedFile.extension,
		);
		const originalFileName = trimmedFileName || sanitizedFileName;

		if (file.size === 0) {
			failures.push({
				fileName: originalFileName,
				error: "File is empty and cannot be uploaded",
				code: "empty",
			});
			continue;
		}

		if (file.size > DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_BYTES) {
			failures.push({
				fileName: originalFileName,
				error: `File exceeds the ${DOCUMENT_VECTOR_STORE_MAX_FILE_SIZE_MB.toFixed(1)}MB limit`,
				code: "oversize",
			});
			continue;
		}

		const storageKey = buildStorageKey(
			documentVectorStoreId,
			sanitizedFileName,
		);

		let buffer: Buffer;
		try {
			const arrayBuffer = await file.arrayBuffer();
			buffer = Buffer.from(arrayBuffer);
		} catch (bufferError) {
			console.error("Failed to read file contents for upload:", bufferError);
			failures.push({
				fileName: originalFileName,
				error: "Failed to read file contents",
				code: "read-error",
			});
			continue;
		}

		const checksum = createHash("sha256").update(buffer).digest("hex");
		const { error: uploadError } = await supabase.storage
			.from(STORAGE_BUCKET)
			.upload(storageKey, buffer, {
				contentType: resolvedFile.contentType,
				upsert: true,
			});

		if (uploadError) {
			console.error("Failed to upload document file to storage:", uploadError);
			failures.push({
				fileName: originalFileName,
				error: "Failed to upload file",
				code: "upload-error",
			});
			continue;
		}

		const sourceId = `dvss_${createId()}` as DocumentVectorStoreSourceId;

		try {
			await db.insert(documentVectorStoreSources).values({
				id: sourceId,
				documentVectorStoreDbId: store.dbId,
				storageBucket: STORAGE_BUCKET,
				storageKey,
				fileName: originalFileName,
				fileSizeBytes: file.size,
				fileChecksum: checksum,
				uploadStatus: "uploaded",
			});
			successes.push({
				fileName: originalFileName,
				sourceId,
				storageKey,
			});

			// Trigger ingestion asynchronously (fire and forget)
			ingestDocument(sourceId).catch((error) => {
				console.error(`Failed to ingest document ${sourceId}:`, error);
			});
		} catch (dbError) {
			console.error(
				`Failed to persist metadata for ${originalFileName}. Rolling back this file.`,
				dbError,
			);
			let rollbackFailed = false;
			try {
				await rollbackUploads([storageKey], []);
			} catch (rollbackError) {
				rollbackFailed = true;
				console.error(
					"Rollback failed after metadata persistence error:",
					rollbackError,
				);
			}
			failures.push({
				fileName: originalFileName,
				error: rollbackFailed
					? "Failed to save metadata and roll back storage"
					: "Failed to save metadata",
				code: rollbackFailed ? "rollback-error" : "metadata-error",
			});
		}
	}

	const hasSuccesses = successes.length > 0;
	const hasFailures = failures.length > 0;
	const validationFailureCodes = new Set([
		"unsupported-type",
		"empty",
		"oversize",
	]);
	const allValidationFailures =
		hasFailures &&
		failures.every((failure) => validationFailureCodes.has(failure.code));
	const hasOversizeFailure = failures.some(
		(failure) => failure.code === "oversize",
	);
	let status: number;
	if (hasSuccesses && hasFailures) {
		status = 207;
	} else if (hasSuccesses) {
		status = 200;
	} else if (allValidationFailures) {
		status = hasOversizeFailure ? 413 : 400;
	} else if (hasFailures) {
		status = 500;
	} else {
		status = 200;
	}

	return NextResponse.json(
		{
			successes,
			failures,
		},
		{ status },
	);
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ documentVectorStoreId: string }> },
) {
	const featureGuard = await ensureFeatureEnabled();
	if (featureGuard) {
		return featureGuard;
	}

	const team = await fetchTeam();
	if (!team) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch (_error) {
		return NextResponse.json(
			{ error: "Invalid request payload" },
			{ status: 400 },
		);
	}

	if (
		!payload ||
		typeof payload !== "object" ||
		!("sourceId" in payload) ||
		typeof (payload as { sourceId: unknown }).sourceId !== "string"
	) {
		return NextResponse.json(
			{ error: "Source ID is required" },
			{ status: 400 },
		);
	}

	const { sourceId } = payload as { sourceId: DocumentVectorStoreSourceId };

	const { documentVectorStoreId: documentVectorStoreIdParam } = await params;
	const documentVectorStoreId =
		documentVectorStoreIdParam as DocumentVectorStoreId;
	const store = await findAccessibleStore(documentVectorStoreId, team.dbId);
	if (!store) {
		return NextResponse.json(
			{ error: "Vector store not found" },
			{ status: 404 },
		);
	}

	try {
		const [source] = await db
			.select({
				id: documentVectorStoreSources.id,
				storageBucket: documentVectorStoreSources.storageBucket,
				storageKey: documentVectorStoreSources.storageKey,
			})
			.from(documentVectorStoreSources)
			.where(
				and(
					eq(documentVectorStoreSources.id, sourceId),
					eq(documentVectorStoreSources.documentVectorStoreDbId, store.dbId),
				),
			)
			.limit(1);

		if (!source) {
			return NextResponse.json({ error: "Source not found" }, { status: 404 });
		}

		const { error: storageError } = await supabase.storage
			.from(source.storageBucket)
			.remove([source.storageKey]);
		if (storageError) {
			console.error(
				`Failed to delete document file ${source.storageKey} from storage:`,
				storageError,
			);
			return NextResponse.json(
				{ error: "Failed to delete file from storage" },
				{ status: 500 },
			);
		}

		await db
			.delete(documentVectorStoreSources)
			.where(eq(documentVectorStoreSources.id, sourceId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete document source:", error);
		return NextResponse.json(
			{ error: "Failed to delete document source" },
			{ status: 500 },
		);
	}
}
