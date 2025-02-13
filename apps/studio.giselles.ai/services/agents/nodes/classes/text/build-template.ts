"use server";

import {
	builds,
	db,
	nodes,
	ports,
	pullMessages,
	requestPortMessages,
	requests,
} from "@/drizzle";
// import { logger } from "@trigger.dev/sdk/v3";
import { and, eq } from "drizzle-orm";
import type { Port } from "../../types";

type BuildTemplateArgs = {
	requestDbId: number;
	nodeDbId: number;
	template: string;
	inputPorts: Port[];
	outputPortId: Port["id"];
};

export const buildTemplate = async ({
	requestDbId,
	nodeDbId,
	template,
	inputPorts,
	outputPortId,
}: BuildTemplateArgs) => {
	const messages = await db
		.with(pullMessages)
		.select()
		.from(pullMessages)
		.where(
			and(
				eq(pullMessages.requestDbId, requestDbId),
				eq(pullMessages.nodeDbId, nodeDbId),
			),
		);

	const regex = /(?<=\{).*?(?=\})/g;
	const matches = Array.from(template.matchAll(regex));
	let finalText = template;
	for (const match of matches) {
		const inputPort = inputPorts.find(({ name }) => name === match[0]);
		if (inputPort == null) {
			// logger.log(`inputPort not found for ${match[0]}`);
			continue;
		}
		const message = messages.find(({ portId }) => portId === inputPort.id);
		if (message == null) {
			// logger.log(`message not found for ${inputPort.id}`);
			continue;
		}
		finalText = finalText.replace(`{${match[0]}}`, message.content);
	}
	const [outputPort] = await db
		.select({ dbId: ports.dbId })
		.from(ports)
		.innerJoin(nodes, eq(nodes.dbId, ports.nodeDbId))
		.innerJoin(builds, eq(builds.dbId, nodes.buildDbId))
		.innerJoin(requests, eq(requests.buildDbId, builds.dbId))
		.where(and(eq(requests.dbId, requestDbId), eq(ports.id, outputPortId)));
	await db.insert(requestPortMessages).values({
		requestDbId: requestDbId,
		portDbId: outputPort.dbId,
		message: finalText,
	});
};
