import {
	AppId,
	type GenerationOutput,
	isCompletedGeneration,
	isFailedGeneration,
	isOperationNode,
	TaskId,
} from "@giselles-ai/protocol";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import { apps } from "@/db/schema";
import { verifyApiSecretForTeam } from "@/lib/api-keys";

type ApiStepItem =
	| {
			id: string;
			title: string;
			status: string;
			generationId: string;
			outputs?: GenerationOutput[];
			error?: string;
	  }
	| {
			id: string;
			title: string;
			status: string;
			generationId: string;
			error: string;
	  };

type ApiStep = {
	title: string;
	status: string;
	items: ApiStepItem[];
};

type ApiOutput = {
	title: string;
	generationId: string;
	outputs: GenerationOutput[];
};

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

	const [appRecord] = await db
		.select({ teamDbId: apps.teamDbId })
		.from(apps)
		.where(eq(apps.id, appId))
		.limit(1);
	if (!appRecord) {
		// Keep behavior consistent with the run endpoint:
		// unauthenticated requests should not reveal whether an appId exists.
		return new Response("Unauthorized", { status: 401 });
	}

	const verifyResult = await verifyApiSecretForTeam({
		teamDbId: appRecord.teamDbId,
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

	const generationsById = Object.fromEntries(
		await Promise.all(
			task.sequences.flatMap((sequence) =>
				sequence.steps.map(async (step) => {
					const generation = await giselle
						.getGeneration(step.generationId)
						.catch(() => undefined);
					return generation ? ([generation.id, generation] as const) : null;
				}),
			),
		).then((entries) => entries.filter((e) => e !== null)),
	);

	const steps: ApiStep[] = task.sequences.map((sequence, sequenceIndex) => ({
		title: `Step ${sequenceIndex + 1}`,
		status: sequence.status,
		items: sequence.steps
			.map((step) => {
				const generation = generationsById[step.generationId];
				if (!generation) {
					return null;
				}
				const operationNode = generation.context.operationNode;
				if (!isOperationNode(operationNode)) {
					return null;
				}

				if (isCompletedGeneration(generation)) {
					return {
						id: step.id,
						title: step.name,
						status: generation.status,
						generationId: generation.id,
						outputs: generation.outputs,
					} satisfies ApiStepItem;
				}
				if (isFailedGeneration(generation)) {
					return {
						id: step.id,
						title: step.name,
						status: generation.status,
						generationId: generation.id,
						error: generation.error.message,
					} satisfies ApiStepItem;
				}
				return {
					id: step.id,
					title: step.name,
					status: generation.status,
					generationId: generation.id,
				} satisfies ApiStepItem;
			})
			.filter((itemOrNull) => itemOrNull !== null),
	}));

	const allStepItems = steps.flatMap((step) => step.items);
	const outputs: ApiOutput[] = (task.nodeIdsConnectedToEnd ?? [])
		.map((nodeId) => {
			const match = allStepItems.find((item) => {
				const generation = generationsById[item.generationId];
				if (!generation) {
					return false;
				}
				return generation.context.operationNode.id === nodeId;
			});
			if (!match) {
				return null;
			}
			const generation = generationsById[match.generationId];
			if (!generation || !isCompletedGeneration(generation)) {
				return null;
			}
			return {
				title: match.title,
				generationId: generation.id,
				outputs: generation.outputs,
			} satisfies ApiOutput;
		})
		.filter((outputOrNull) => outputOrNull !== null);

	return Response.json(
		{
			task: {
				id: task.id,
				status: task.status,
				workspaceId: task.workspaceId,
				name: task.name,
				steps,
				outputs,
			},
		},
		{ headers: { "Cache-Control": "no-store" } },
	);
}
