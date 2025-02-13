import { db, requestStacks, requestSteps, requests } from "@/drizzle";
import { createId } from "@paralleldrive/cuid2";
import { and, asc, eq } from "drizzle-orm";
import {
	type RequestId,
	type RequestStackId,
	type RequestStatus,
	requestStepStatus,
} from "../types";
import { getNextNode } from "./get-next-node";
import { revalidateGetRequest } from "./get-request";

export const updateRequestStatus = async (
	requestId: RequestId,
	status: RequestStatus,
) => {
	await db
		.update(requests)
		.set({
			status,
		})
		.where(eq(requests.id, requestId));
	await revalidateGetRequest(requestId);
};

export const pushNextNodeToRequestStack = async (
	requestStackDbId: number,
	currentNodeDbId: number,
	requestId: RequestId,
) => {
	const nextNode = await getNextNode(currentNodeDbId);
	if (nextNode == null) {
		return;
	}
	await db.insert(requestSteps).values({
		id: `rqst.stp_${createId()}`,
		requestStackDbId,
		nodeDbId: nextNode.dbId,
	});
	await revalidateGetRequest(requestId);
	return nextNode;
};

export async function* runStackGenerator(requestStackId: RequestStackId) {
	const [requestStack] = await db
		.select({
			dbId: requestStacks.dbId,
		})
		.from(requestStacks)
		.where(eq(requestStacks.id, requestStackId));

	while (true) {
		const [step] = await getFirstQueuedStep(requestStack.dbId);
		if (step == null) break;
		yield step;
	}
}

async function getFirstQueuedStep(requestStackDbId: number) {
	return await db
		.select({ dbId: requestSteps.dbId, id: requestSteps.id })
		.from(requestSteps)
		.where(
			and(
				eq(requestSteps.requestStackDbId, requestStackDbId),
				eq(requestSteps.status, requestStepStatus.inProgress),
			),
		)
		.orderBy(asc(requestSteps.dbId))
		.limit(1);
}
