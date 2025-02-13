"use server";

import { agents, builds, db } from "@/drizzle";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import type { AgentId } from "../../types";
import type { PlaygroundGraph } from "../types";
import { revalidateGetGraph } from "./get-graph";

export const setGraph = async (agentId: AgentId, graph: PlaygroundGraph) => {
	await db
		.update(agents)
		.set({ graph, graphHash: createId() })
		.where(eq(agents.id, agentId));
	await revalidateGetGraph({
		agentId,
	});
};
