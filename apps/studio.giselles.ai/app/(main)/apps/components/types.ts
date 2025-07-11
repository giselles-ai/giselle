import type { AgentId } from "@/services/agents";

type Agent = {
	id: AgentId;
	name: string | null;
	updatedAt: Date;
	workspaceId: string | null;
};

export type AgentGridProps = {
	agents: Agent[];
};

export type AgentCardProps = {
	agent: Agent;
};

export type Position = {
	x: number;
	y: number;
};
