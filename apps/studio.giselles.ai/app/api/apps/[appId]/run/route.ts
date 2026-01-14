import {
	AppId,
	type AppParameter,
	createUploadedFileData,
	createUploadingFileData,
	FileId,
	type GenerationContextInput,
	type ParameterItem,
	UploadedFileData,
	type UploadedFileData as UploadedFileDataType,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import * as z from "zod/v4";
import { giselle, storage } from "@/app/giselle";
import { db } from "@/db";
import { apps, teams } from "@/db/schema";
import { verifyApiSecretForTeam } from "@/lib/api-keys";
import {
	buildRateLimitHeaders,
	consumeTeamRateLimit,
} from "../../../_lib/rate-limit";

const MAX_INLINE_FILE_DECODED_BYTES = 1024 * 1024 * 3;

function fileMetadataPath(args: { workspaceId: WorkspaceId; fileId: FileId }) {
	return `workspaces/${args.workspaceId}/files/${args.fileId}/metadata.json`;
}

const requestSchema = z.object({
	text: z.string(),
	file: z
		.union([
			z
				.object({
					fileId: FileId.schema,
				})
				.strict(),
			z
				.object({
					base64: z.string(),
					name: z.string().min(1),
					type: z.string().min(1),
				})
				.strict(),
		])
		.optional(),
});

async function buildInputs(args: {
	appParameters: AppParameter[];
	text: string;
	file:
		| { fileId: FileId }
		| { base64: string; name: string; type: string }
		| undefined;
	workspaceId: WorkspaceId;
}): GenerationContextInput[] {
	const multilineTextParam = args.appParameters.find(
		(p) => p.type === "multiline-text",
	);
	const singleLineTextParam = args.appParameters.find((p) => p.type === "text");
	const targetParam = multilineTextParam ?? singleLineTextParam;

	if (!targetParam) {
		throw new Error("App has no text parameter");
	}

	const items: ParameterItem[] = [
		{
			name: targetParam.id,
			type: "string",
			value: args.text,
		},
	];

	if (args.file !== undefined) {
		const filesParam = args.appParameters.find((p) => p.type === "files");
		if (!filesParam) {
			throw new Error("App has no files parameter");
		}

		let uploadedFile: UploadedFileDataType;
		if ("fileId" in args.file) {
			const fileId = args.file.fileId;
			const metadataFilePath = fileMetadataPath({
				workspaceId: args.workspaceId,
				fileId,
			});
			const exists = await storage.exists(metadataFilePath);
			if (!exists) {
				throw new Error("File metadata not found. Please re-upload the file.");
			}
			const metadataBlob = await storage.getBlob(
				fileMetadataPath({
					workspaceId: args.workspaceId,
					fileId,
				}),
			);
			let metadataJson: unknown;
			try {
				metadataJson = JSON.parse(
					Buffer.from(metadataBlob as Uint8Array).toString("utf-8"),
				);
			} catch {
				throw new Error("Invalid file metadata. Please re-upload the file.");
			}

			const parsed = UploadedFileData.safeParse(metadataJson);
			if (!parsed.success || parsed.data.id !== fileId) {
				throw new Error("Invalid file metadata. Please re-upload the file.");
			}
			uploadedFile = parsed.data;
		} else {
			let bytes: Buffer;
			try {
				bytes = Buffer.from(args.file.base64, "base64");
			} catch {
				throw new Error("Invalid base64 file payload");
			}
			if (bytes.byteLength > MAX_INLINE_FILE_DECODED_BYTES) {
				throw new Error("Inline file payload is too large (max 3MB)");
			}

			const uploading = createUploadingFileData({
				name: args.file.name,
				type: args.file.type,
				size: bytes.byteLength,
			});
			const file = new File([bytes], args.file.name, { type: args.file.type });
			await giselle.uploadFile(
				file,
				args.workspaceId,
				uploading.id,
				args.file.name,
			);
			uploadedFile = createUploadedFileData(uploading, Date.now());
		}

		items.push({
			name: filesParam.id,
			type: "files",
			value: [uploadedFile],
		});
	}

	return [
		{
			type: "parameters",
			items,
		},
	];
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) {
	const rawAppId = (await params).appId;
	const appIdParse = AppId.safeParse(rawAppId);
	if (!appIdParse.success) {
		return new Response("Invalid appId", { status: 400 });
	}
	const appId = appIdParse.data;

	const [teamRecord] = await db
		.select({
			teamDbId: apps.teamDbId,
			plan: teams.plan,
		})
		.from(apps)
		.innerJoin(teams, eq(teams.dbId, apps.teamDbId))
		.where(eq(apps.id, appId))
		.limit(1);

	if (!teamRecord) {
		// Keep behavior consistent with pre-DB lookup auth checks:
		// unauthenticated requests should not reveal whether an appId exists.
		return new Response("Unauthorized", { status: 401 });
	}

	const verifyResult = await verifyApiSecretForTeam({
		teamDbId: teamRecord.teamDbId,
		authorizationHeader: request.headers.get("authorization"),
	});
	if (!verifyResult.ok) {
		return new Response("Unauthorized", { status: 401 });
	}

	const rateLimit = await consumeTeamRateLimit({
		teamDbId: teamRecord.teamDbId,
		plan: teamRecord.plan,
		routeKey: "api_apps_run",
		now: new Date(),
	});

	const rateLimitHeaders = buildRateLimitHeaders({
		limit: rateLimit.limit,
		remaining: rateLimit.remaining,
		resetAt: rateLimit.resetAt,
		retryAfterSeconds: rateLimit.allowed
			? undefined
			: rateLimit.retryAfterSeconds,
	});

	if (!rateLimit.allowed) {
		return new Response("Rate limit exceeded", {
			status: 429,
			headers: rateLimitHeaders,
		});
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON body", {
			status: 400,
			headers: rateLimitHeaders,
		});
	}

	const parsed = requestSchema.safeParse(body);
	if (!parsed.success) {
		return new Response("Invalid request body", {
			status: 400,
			headers: rateLimitHeaders,
		});
	}

	const app = await giselle.getApp({ appId }).catch(() => null);
	if (!app) {
		return new Response("App not found", {
			status: 404,
			headers: rateLimitHeaders,
		});
	}

	let inputs: GenerationContextInput[];
	try {
		inputs = await buildInputs({
			appParameters: app.parameters,
			text: parsed.data.text,
			file: parsed.data.file,
			workspaceId: app.workspaceId,
		});
	} catch (error) {
		const message =
			error instanceof Error && error.message.length > 0
				? error.message
				: "Invalid request body";
		return new Response(message, {
			status: 400,
			headers: rateLimitHeaders,
		});
	}

	const { task } = await giselle.createTask({
		workspaceId: app.workspaceId,
		nodeId: app.entryNodeId,
		inputs,
		generationOriginType: "api",
	});

	await giselle.startTask({
		taskId: task.id,
		generationOriginType: "api",
	});

	return Response.json({ taskId: task.id }, { headers: rateLimitHeaders });
}
