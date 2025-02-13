import { type InferInput, custom, nullable, object, string } from "valibot";
import type { Port } from "./nodes";

export type AgentId = `agnt_${string}`;
const agentIdSchema = custom<AgentId>(
	(input) => typeof input === "string" && /^agnt_.*$/.test(input),
);

export type BuildId = `bld_${string}`;
const buildIdSchema = custom<BuildId>(
	(input) => typeof input === "string" && /^bld_.*$/.test(input),
);

export const agentSchema = object({
	id: agentIdSchema,
	buildId: buildIdSchema,
	name: nullable(string()),
	args: custom<Port[]>(() => true),
});

export type Agent = InferInput<typeof agentSchema>;
