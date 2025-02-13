"use server";

import { db, nodes, requestStacks, requestSteps, requests } from "@/drizzle";
import { eq } from "drizzle-orm";
import { assertNodeClassName, nodeService } from "../../nodes";
import {
	type RequestId,
	type RequestStackId,
	type RequestStepId,
	requestStatus,
	requestStepStatus,
} from "../types";
import { getDependedNodes } from "./get-depended-nodes";
import { revalidateGetRequest } from "./get-request";
import { pushNextNodeToRequestStack } from "./run";
export async function runStep(
	requestId: RequestId,
	requestStackId: RequestStackId,
	requestStepId: RequestStepId,
) {
	const [request, requestStack, requestStep] = await Promise.all([
		db.query.requests.findFirst({
			where: eq(requests.id, requestId),
		}),
		db.query.requestStacks.findFirst({
			where: eq(requestStacks.id, requestStackId),
		}),
		db.query.requestSteps.findFirst({
			where: eq(requestSteps.id, requestStepId),
		}),
	]);
	if (request == null || requestStack == null || requestStep == null) {
		throw new Error("Request, request stack, or request step not found");
	}
	await db
		.update(requestSteps)
		.set({
			status: requestStepStatus.inProgress,
		})
		.where(eq(requestSteps.id, requestStepId));
	const [node] = await db
		.select({
			id: nodes.id,
			dbId: nodes.dbId,
			className: nodes.className,
			graph: nodes.graph,
		})
		.from(nodes)
		.innerJoin(requestSteps, eq(nodes.dbId, requestSteps.nodeDbId))
		.where(eq(requestSteps.id, requestStepId));
	const dependedNodes = await getDependedNodes({
		requestDbId: request.dbId,
		nodeDbId: node.dbId,
	});
	for (const dependedNode of dependedNodes) {
		assertNodeClassName(dependedNode.className);
		await nodeService.runResolver(dependedNode.className, {
			requestId,
			requestDbId: request.dbId,
			nodeDbId: dependedNode.dbId,
			node: dependedNode.graph,
		});
	}
	assertNodeClassName(node.className);
	console.log(`action ---- ${node.className}`);
	await nodeService.runAction(node.className, {
		requestId,
		requestDbId: request.dbId,
		nodeDbId: node.dbId,
		node: node.graph,
	});
	const nextNode = await pushNextNodeToRequestStack(
		requestStack.dbId,
		node.dbId,
		requestId,
	);
	await db
		.update(requestSteps)
		.set({
			status: requestStepStatus.completed,
		})
		.where(eq(requestSteps.dbId, requestStep.dbId));
	if (nextNode == null) {
		console.log("start set complete");
		await db
			.update(requests)
			.set({
				status: requestStatus.completed,
			})
			.where(eq(requests.dbId, request.dbId));
		console.log("end set complete");
	}
	await revalidateGetRequest(requestId);
}
