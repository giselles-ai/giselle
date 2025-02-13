"use server";

import {
	agents,
	builds,
	db,
	nodes,
	ports,
	requests,
	triggerNodes,
} from "@/drizzle";
import { and, eq, exists, isNotNull, max, sql } from "drizzle-orm";
import { requestStatus } from "../../requests/types";
import type { Agent } from "../../types";
import { portDirection, portType } from "../types";

export const getAvailableAgents = async () => {
	await db.select().from(agents);
	const availableAgentsQuery = db
		.select({
			agentDbId: agents.dbId,
			latestBuildDbId: max(builds.dbId).as("latestBuildDbId"),
		})
		.from(requests)
		.innerJoin(builds, eq(builds.dbId, requests.dbId))
		.innerJoin(
			agents,
			and(eq(agents.dbId, builds.agentDbId), isNotNull(agents.name)),
		)
		.where(eq(requests.status, requestStatus.completed))
		.groupBy(agents.dbId)
		.as("available_agents_query");

	const availableAgents = await db
		.select({
			id: agents.id,
			name: agents.name,
			buildId: builds.id,
			triggerNode: nodes.graph,
		})
		.from(agents)
		.innerJoin(
			availableAgentsQuery,
			eq(agents.dbId, availableAgentsQuery.agentDbId),
		)
		.innerJoin(builds, eq(builds.dbId, availableAgentsQuery.latestBuildDbId))
		.innerJoin(triggerNodes, eq(triggerNodes.buildDbId, builds.dbId))
		.innerJoin(nodes, eq(nodes.dbId, triggerNodes.nodeDbId));
	return availableAgents.map(
		(agent) =>
			({
				id: agent.id,
				name: agent.name,
				buildId: agent.buildId,
				args: agent.triggerNode.ports.filter(
					({ direction, type }) =>
						direction === portDirection.source && type === portType.data,
				),
			}) satisfies Agent,
	);
};
