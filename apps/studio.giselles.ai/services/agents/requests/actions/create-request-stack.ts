"use server";
import { builds, db, requestStacks, requests } from "@/drizzle";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import { getResponseNode, getTriggerNode } from "../helpers";
import type { RequestId } from "../types";
import { getNodeDbId } from "./get-node-id";
import { revalidateGetRequest } from "./get-request";
import { pushNextNodeToRequestStack } from "./run";

type CreateRequestStackArgs = {
	requestId: RequestId;
};
export async function createRequestStack(args: CreateRequestStackArgs) {
	const [request] = await db
		.select({
			dbId: requests.dbId,
			graph: builds.graph,
		})
		.from(requests)
		.innerJoin(builds, eq(builds.dbId, requests.buildDbId))
		.where(eq(requests.id, args.requestId));

	const triggerNode = getTriggerNode(request.graph);
	const responseNode = getResponseNode(request.graph);
	if (triggerNode == null || responseNode == null) {
		throw new Error("Required node not found");
	}

	const triggerNodeDbId = await getNodeDbId(triggerNode.id, request.dbId);
	const responseNodeDbId = await getNodeDbId(responseNode.id, request.dbId);

	const alreadyCreatedStack = await db.query.requestStacks.findFirst({
		where: and(
			eq(requestStacks.requestDbId, request.dbId),
			eq(requestStacks.startNodeDbId, triggerNodeDbId),
			eq(requestStacks.endNodeDbId, responseNodeDbId),
		),
	});

	if (alreadyCreatedStack != null) {
		return { id: alreadyCreatedStack.id };
	}
	const [newRequestStack] = await db
		.insert(requestStacks)
		.values({
			id: `rqst.stck_${createId()}`,
			requestDbId: request.dbId,
			startNodeDbId: triggerNodeDbId,
			endNodeDbId: responseNodeDbId,
		})
		.returning({
			requestDbId: requestStacks.requestDbId,
			dbId: requestStacks.dbId,
			id: requestStacks.id,
		});

	await pushNextNodeToRequestStack(
		newRequestStack.dbId,
		triggerNodeDbId,
		args.requestId,
	);
	await revalidateGetRequest(args.requestId);
	return { id: newRequestStack.id };
}
