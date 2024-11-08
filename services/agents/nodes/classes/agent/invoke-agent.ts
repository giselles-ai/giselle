"use server";

import { db, pullMessages, requestResults } from "@/drizzle";
// import { logger, runs } from "@trigger.dev/sdk/v3";
import { and, eq, inArray } from "drizzle-orm";
import {
	createRequest,
	insertRequestPortMessage,
} from "../../../requests/actions";
import { runOnVercel } from "../../../requests/runners";
import type { Agent } from "../../../types";
import {
	type NodeGraph,
	type Port,
	portDirection,
	portType,
} from "../../types";

type InvokeAgentArgs = {
	requestDbId: number;
	nodeDbId: number;
	agent: Agent;
	resultPort: Port;
	nodeGraph: NodeGraph;
};

export const invokeAgent = async ({
	requestDbId,
	nodeDbId,
	agent,
	resultPort,
	nodeGraph,
}: InvokeAgentArgs) => {
	const targetPorts = nodeGraph.ports.filter(
		({ direction, type }) =>
			direction === portDirection.target && type === portType.data,
	);
	const incomingMessages = await db
		.with(pullMessages)
		.select()
		.from(pullMessages)
		.where(
			and(
				eq(pullMessages.requestDbId, requestDbId),
				eq(pullMessages.nodeDbId, nodeDbId),
				inArray(
					pullMessages.portId,
					targetPorts.map(({ id }) => id),
				),
			),
		);
	const parameters = agent.args
		.map((arg) => {
			const relatedPort = targetPorts.find(
				(targetPort) => targetPort.name === arg.name,
			);
			if (relatedPort == null) {
				return null;
			}
			const reletatedMessage = incomingMessages.find(
				(message) => message.portId === relatedPort.id,
			);
			if (reletatedMessage == null) {
				return null;
			}
			return {
				portId: arg.id,
				value: reletatedMessage.content,
			};
		})
		.filter((i) => i != null);
	const request = await createRequest({
		buildId: agent.buildId,
		parameters,
	});
	await runOnVercel({
		requestId: request.id,
	});
	const [relevantAgentRequestResult] = await db
		.select({ text: requestResults.text })
		.from(requestResults)
		.where(eq(requestResults.requestDbId, request.dbId));
	await insertRequestPortMessage({
		requestId: request.id,
		requestDbId,
		portId: resultPort.id,
		message: relevantAgentRequestResult.text,
	});
};
