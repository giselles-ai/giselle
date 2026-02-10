import { describe, expect, test } from "vitest";
import type { TeamPlan } from "@/db/schema";
import {
	canUseDataStore,
	getDataStoreLimit,
	getDataStoreQuota,
} from "./data-store";

describe("data store quotas", () => {
	const cases = [
		{ plan: "free", isAvailable: false, maxStores: 0 },
		{ plan: "pro", isAvailable: true, maxStores: 10 },
		{ plan: "team", isAvailable: true, maxStores: 20 },
		{ plan: "enterprise", isAvailable: true, maxStores: 100 },
		{ plan: "internal", isAvailable: true, maxStores: 100 },
	] satisfies Array<{
		plan: TeamPlan;
		isAvailable: boolean;
		maxStores: number;
	}>;

	test.each(cases)(
		"plan %s returns expected quota values",
		({ plan, isAvailable, maxStores }) => {
			const quota = getDataStoreQuota(plan);
			expect(quota.isAvailable).toBe(isAvailable);
			expect(quota.maxStores).toBe(maxStores);
		},
	);

	test.each(cases)(
		"plan %s availability helper mirrors quota",
		({ plan, isAvailable }) => {
			expect(canUseDataStore(plan)).toBe(isAvailable);
		},
	);

	test.each(cases)(
		"plan %s limit helper mirrors quota",
		({ plan, maxStores }) => {
			expect(getDataStoreLimit(plan)).toBe(maxStores);
		},
	);
});
