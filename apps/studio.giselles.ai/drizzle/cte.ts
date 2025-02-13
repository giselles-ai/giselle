import type { Port } from "@/services/agents/nodes";
import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./db";
import { edges, ports, requestPortMessages, requests } from "./schema";

const sourcePorts = alias(ports, "source_ports");
const targetPorts = alias(ports, "target_ports");
export const pullMessages = db.$with("pullMessages").as(
	db
		.select({
			content: sql<string>`${requestPortMessages.message}`.as("content"),
			requestDbId: sql<number>`${requests.dbId}`.as("requestDbId"),
			portDbId: sql<number>`${targetPorts.dbId}`.as("portDbId"),
			portId: sql<Port["id"]>`${targetPorts.id}`.as("portId"),
			nodeDbId: sql<number>`${targetPorts.nodeDbId}`.as("nodeDbId"),
		})
		.from(requestPortMessages)
		.innerJoin(requests, eq(requests.dbId, requestPortMessages.requestDbId))
		.innerJoin(sourcePorts, eq(sourcePorts.dbId, requestPortMessages.portDbId))
		.innerJoin(edges, eq(edges.sourcePortDbId, sourcePorts.dbId))
		.innerJoin(targetPorts, eq(targetPorts.dbId, edges.targetPortDbId)),
);
