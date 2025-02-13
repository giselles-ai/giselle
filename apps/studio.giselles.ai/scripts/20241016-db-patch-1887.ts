import { agents, db } from "@/drizzle";
import { eq } from "drizzle-orm";

const listOfAgents = await db.select().from(agents);
for (const agent of listOfAgents) {
	if (agent.graphv2.connectors.length < 1) {
		continue;
	}
	const newConnectors = agent.graphv2.connectors
		.map((connector) => {
			const sourceNode = agent.graphv2.nodes.find(
				(node) => node.id === connector.source,
			);
			const targetNode = agent.graphv2.nodes.find(
				(node) => node.id === connector.target,
			);
			if (sourceNode === undefined || targetNode === undefined) {
				return null;
			}
			return {
				...connector,
				sourceNodeArcheType: sourceNode.archetype,
				targetNodeArcheType: targetNode.archetype,
			};
		})
		.filter((dataOrNull) => dataOrNull !== null);

	await db
		.update(agents)
		.set({
			graphv2: {
				...agent.graphv2,
				connectors: newConnectors,
			},
		})
		.where(eq(agents.id, agent.id));
}
