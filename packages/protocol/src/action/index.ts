import z from "zod/v4";
import { GitHubAction } from "./github";
import { WebSearchAction } from "./web-search";

export * from "./github";
export * from "./web-search";

export const ActionProvider = z.union([
	GitHubAction.shape.provider,
	WebSearchAction.shape.provider,
]);
export type ActionProvider = z.infer<typeof ActionProvider>;
