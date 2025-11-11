import { describe, expect, test } from "vitest";
import type { TeamPlan } from "@/db/schema";
import {
	canUseDocumentVectorStores,
	getDocumentVectorStoreLimit,
	getDocumentVectorStoreQuota,
} from "./document-vector-store";

describe("document vector store quotas", () => {
	const cases = [
		{ plan: "free", isAvailable: false, maxStores: 0 },
		{ plan: "pro", isAvailable: true, maxStores: 5 },
		{ plan: "team", isAvailable: true, maxStores: 20 },
		{ plan: "internal", isAvailable: true, maxStores: 100 },
	] satisfies Array<{
		plan: TeamPlan;
		isAvailable: boolean;
		maxStores: number;
	}>;

	test.each(cases)(
		"plan %s returns expected quota values",
		({ plan, isAvailable, maxStores }) => {
			const quota = getDocumentVectorStoreQuota(plan);
			expect(quota.isAvailable).toBe(isAvailable);
			expect(quota.maxStores).toBe(maxStores);
		},
	);

	test.each(cases)(
		"plan %s availability helper mirrors quota",
		({ plan, isAvailable }) => {
			expect(canUseDocumentVectorStores(plan)).toBe(isAvailable);
		},
	);

	test.each(cases)(
		"plan %s limit helper mirrors quota",
		({ plan, maxStores }) => {
			expect(getDocumentVectorStoreLimit(plan)).toBe(maxStores);
		},
	);
});
