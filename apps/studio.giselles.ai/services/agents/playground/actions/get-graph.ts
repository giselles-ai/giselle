"use server";

import { agents, builds, db } from "@/drizzle";
import { eq } from "drizzle-orm";
import { revalidateTag, unstable_cache } from "next/cache";
import type { AgentId } from "../../types";

type GetGraphArgs = {
	agentId: AgentId;
};
type TagParams = {
	agentId: AgentId;
};
const tag = (params: TagParams) => `${params.agentId}.getGraph`;
export const getGraph = async (args: GetGraphArgs) => {
	const cached = unstable_cache(
		async () => {
			const [agent] = await db
				.select()
				.from(agents)
				.where(eq(agents.id, args.agentId));
			return agent.graph;
		},
		[args.agentId],
		{
			tags: [tag(args)],
		},
	);
	return await cached();
};

export const revalidateGetGraph = async (params: TagParams) => {
	revalidateTag(tag(params));
};
