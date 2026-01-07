import {
	AppId,
	type AppParameter,
	type GenerationContextInput,
	type ParameterItem,
} from "@giselles-ai/protocol";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import * as z from "zod/v4";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import { apps, teams } from "@/db/schema";
import { verifyApiSecretForTeam } from "@/lib/api-keys";
import {
	buildRateLimitHeaders,
	consumeTeamRateLimit,
} from "../../../_lib/rate-limit";

const requestSchema = z.object({
	text: z.string(),
});

function buildInputsFromText(args: {
	appParameters: AppParameter[];
	text: string;
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
		return new Response("App not found", { status: 404 });
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
		inputs = buildInputsFromText({
			appParameters: app.parameters,
			text: parsed.data.text,
		});
	} catch {
		return new Response("App has no text parameter", {
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
