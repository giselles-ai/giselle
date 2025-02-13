"use server";

import {
	builds,
	db,
	edges,
	nodes,
	ports,
	requestPortMessages,
	requestResults,
	requests,
} from "@/drizzle";
import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Port } from "../../types";

type InsertRequestResultArgs = {
	requestDbId: number;
	nodeDbId: number;
	outputPort: Port;
};

const sourcePorts = alias(ports, "source_ports");
const targetPorts = alias(ports, "target_ports");
export const insertRequestResult = async ({
	requestDbId,
	nodeDbId,
	...args
}: InsertRequestResultArgs) => {
	const [message] = await db
		.select({ content: requestPortMessages.message })
		.from(requestPortMessages)
		.innerJoin(sourcePorts, eq(sourcePorts.dbId, requestPortMessages.portDbId))
		.innerJoin(edges, eq(edges.sourcePortDbId, sourcePorts.dbId))
		.innerJoin(targetPorts, eq(targetPorts.dbId, edges.targetPortDbId))
		.innerJoin(nodes, eq(nodes.dbId, targetPorts.nodeDbId))
		.innerJoin(builds, eq(builds.dbId, nodes.buildDbId))
		.innerJoin(requests, eq(requests.buildDbId, builds.dbId))
		.where(
			and(
				eq(requests.dbId, requestDbId),
				eq(targetPorts.id, args.outputPort.id),
			),
		);
	console.log("start insert request result");
	await db.insert(requestResults).values({
		requestDbId,
		text: message.content as string,
	});
	console.log("end insert request result");
};
