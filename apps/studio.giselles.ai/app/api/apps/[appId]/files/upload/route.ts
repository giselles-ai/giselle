import {
	AppId,
	createUploadedFileData,
	createUploadingFileData,
} from "@giselles-ai/protocol";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import { apps, teams } from "@/db/schema";
import { verifyApiSecretForTeam } from "@/lib/api-keys";
import {
	buildRateLimitHeaders,
	consumeTeamRateLimit,
} from "../../../../_lib/rate-limit";

/**
 * Hard limit to upload file since Vercel Serverless Functions have a 4.5MB body size limit.
 * Keep this consistent with internal uploads.
 * @see apps/studio.giselles.ai/lib/internal-api/files.ts
 */
const MAX_UPLOAD_SIZE_BYTES = 1024 * 1024 * 4.5;

function formatFileSize(size: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let formattedSize = size;
	let i = 0;
	while (formattedSize >= 1024 && i < units.length - 1) {
		formattedSize /= 1024;
		i++;
	}
	return `${formattedSize} ${units[i]}`;
}

function getFileSizeExceededMessage(maxSizeBytes: number) {
	return `File size exceeds the limit. Please upload a file smaller than ${formatFileSize(maxSizeBytes)}.`;
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
		// Keep behavior consistent with the run endpoint:
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
		routeKey: "api_apps_upload_file",
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

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return new Response("Invalid request body", {
			status: 400,
			headers: rateLimitHeaders,
		});
	}

	const file = formData.get("file");
	const fileNameRaw = formData.get("fileName");
	if (!(file instanceof File)) {
		return new Response("Invalid request body", {
			status: 400,
			headers: rateLimitHeaders,
		});
	}

	if (file.size > MAX_UPLOAD_SIZE_BYTES) {
		return new Response(getFileSizeExceededMessage(MAX_UPLOAD_SIZE_BYTES), {
			status: 400,
			headers: rateLimitHeaders,
		});
	}

	const fileName =
		typeof fileNameRaw === "string" && fileNameRaw.length > 0
			? fileNameRaw
			: file.name;

	const app = await giselle.getApp({ appId }).catch(() => null);
	if (!app) {
		return new Response("App not found", {
			status: 404,
			headers: rateLimitHeaders,
		});
	}

	const uploading = createUploadingFileData({
		name: fileName,
		type: file.type,
		size: file.size,
	});
	await giselle.uploadFile(file, app.workspaceId, uploading.id, fileName);
	const uploaded = createUploadedFileData(uploading, Date.now());

	return Response.json({ file: uploaded }, { headers: rateLimitHeaders });
}
