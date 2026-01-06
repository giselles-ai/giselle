import { verifyApiSecretForApp } from "@giselles-ai/giselle";
import { AppId, TaskId } from "@giselles-ai/protocol";
import type { NextRequest } from "next/server";
import { giselle } from "@/app/giselle";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ appId: string; taskId: string }> },
) {
	const { appId: rawAppId, taskId: rawTaskId } = await params;

	const appIdParse = AppId.safeParse(rawAppId);
	if (!appIdParse.success) {
		return new Response("Invalid appId", { status: 400 });
	}
	const appId = appIdParse.data;

	const taskIdParse = TaskId.schema.safeParse(rawTaskId);
	if (!taskIdParse.success) {
		return new Response("Invalid taskId", { status: 400 });
	}
	const taskId = taskIdParse.data;

	const verifyResult = await verifyApiSecretForApp({
		context: giselle.getContext(),
		appId,
		authorizationHeader: request.headers.get("authorization"),
	});
	if (!verifyResult.ok) {
		return new Response("Unauthorized", { status: 401 });
	}

	const task = await giselle.getTask({ taskId }).catch(() => null);
	if (!task) {
		return new Response("Not found", { status: 404 });
	}

	// Do not allow cross-app task access and avoid leaking task existence.
	if (task.starter.type !== "app" || task.starter.appId !== appId) {
		return new Response("Not found", { status: 404 });
	}

	const includeGenerations =
		request.nextUrl.searchParams.get("includeGenerations") === "1";

	if (!includeGenerations) {
		return Response.json(
			{ task },
			{ headers: { "Cache-Control": "no-store" } },
		);
	}

	const generations = await Promise.all(
		task.sequences.flatMap((sequence) =>
			sequence.steps.map(async (step) => {
				return await giselle
					.getGeneration(step.generationId)
					.catch(() => undefined);
			}),
		),
	).then((results) => results.filter((g) => g !== undefined));

	return Response.json(
		{
			task,
			generations,
		},
		{ headers: { "Cache-Control": "no-store" } },
	);
}
