"use server";

import {
	agents,
	builds,
	db,
	edges,
	nodes,
	ports,
	triggerNodes,
} from "@/drizzle";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import invariant from "tiny-invariant";
import { assertNodeClassName, nodeService } from "../../nodes";
import type { AgentId } from "../../types";
import { getTriggerNode } from "../helpers";

export const buildPlaygroundGraph = async (agentId: AgentId) => {
	const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
	invariant(agent.graphHash != null, "Agent graph must be set");

	const [build] = await db
		.select()
		.from(builds)
		.where(eq(builds.graphHash, agent.graphHash));
	if (build != null) {
		return { id: build.id };
	}
	const result = await db.transaction(async (tx) => {
		invariant(agent.graphHash != null, "Agent graph must be set");
		const buildId = `bld_${createId()}` as const;
		const [newBuild] = await tx
			.insert(builds)
			.values({
				id: buildId,
				agentDbId: agent.dbId,
				graph: agent.graph,
				graphHash: agent.graphHash,
			})
			.returning({
				id: builds.id,
				dbId: builds.dbId,
			});
		const newNodes = await tx
			.insert(nodes)
			.values(
				agent.graph.nodes.map(({ id, className, data, ports, name }) => ({
					id,
					buildDbId: newBuild.dbId,
					className,
					data,
					graph: {
						id,
						name,
						className,
						data,
						ports,
					},
				})),
			)
			.returning({
				id: nodes.id,
				dbId: nodes.dbId,
				className: nodes.className,
				graph: nodes.graph,
			});
		await Promise.all(
			newNodes.map(async (newNode) => {
				assertNodeClassName(newNode.className);
				await nodeService.runAfterCreateCallback(newNode.className, {
					nodeDbId: newNode.dbId,
					nodeGraph: newNode.graph,
				});
			}),
		);
		const portInsertValues = agent.graph.nodes
			.flatMap((node) =>
				node.ports.map(({ id, name, nodeId, type, direction }) => {
					const [node] = newNodes.filter((node) => node.id === nodeId);
					if (node == null) {
						return null;
					}
					const portInsertValue = {
						id,
						name,
						nodeDbId: node.dbId,
						type,
						direction,
					} satisfies typeof ports.$inferInsert;
					return portInsertValue;
				}),
			)
			.filter((v) => v != null);
		const newPorts = await tx.insert(ports).values(portInsertValues).returning({
			id: ports.id,
			dbId: ports.dbId,
		});
		const edgeInsertValues = agent.graph.edges
			.map(({ id, sourcePortId, targetPortId }) => {
				const sourcePort = newPorts.find(({ id }) => id === sourcePortId);
				const targetPort = newPorts.find(({ id }) => id === targetPortId);
				if (sourcePort == null || targetPort == null) {
					return null;
				}
				const edgeInsertValue = {
					id,
					buildDbId: newBuild.dbId,
					sourcePortDbId: sourcePort.dbId,
					targetPortDbId: targetPort.dbId,
				} satisfies typeof edges.$inferInsert;
				return edgeInsertValue;
			})
			.filter((v) => v != null);
		await tx.insert(edges).values(edgeInsertValues);
		const triggerNode = getTriggerNode(agent.graph);
		const triggerNodeDbId = newNodes.find(({ id }) => triggerNode?.id)?.dbId;
		invariant(triggerNodeDbId != null, "Trigger node must be present");
		await tx.insert(triggerNodes).values({
			buildDbId: newBuild.dbId,
			nodeDbId: triggerNodeDbId,
		});
		return { id: newBuild.id };
	});
	return result;
};
