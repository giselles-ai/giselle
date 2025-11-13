import { describe, expect, test } from "vitest";
import type { TeamPlan } from "@/db/schema";
import {
	canManageTeamMembers,
	getTeamMemberLimit,
	getTeamMemberQuota,
} from "./team-members";

describe("team member quotas", () => {
	const cases = [
		{ plan: "free", isAvailable: false, maxMembers: 1 },
		{ plan: "pro", isAvailable: false, maxMembers: 1 },
		{ plan: "team", isAvailable: true, maxMembers: 10 },
		{ plan: "enterprise", isAvailable: true, maxMembers: 100 },
		{ plan: "internal", isAvailable: true, maxMembers: 100 },
	] satisfies Array<{
		plan: TeamPlan;
		isAvailable: boolean;
		maxMembers: number;
	}>;

	test.each(cases)(
		"plan %s returns expected quota values",
		({ plan, isAvailable, maxMembers }) => {
			const quota = getTeamMemberQuota(plan);
			expect(quota.isAvailable).toBe(isAvailable);
			expect(quota.maxMembers).toBe(maxMembers);
		},
	);

	test.each(cases)(
		"plan %s availability helper mirrors quota",
		({ plan, isAvailable }) => {
			expect(canManageTeamMembers(plan)).toBe(isAvailable);
		},
	);

	test.each(cases)(
		"plan %s limit helper mirrors quota",
		({ plan, maxMembers }) => {
			expect(getTeamMemberLimit(plan)).toBe(maxMembers);
		},
	);
});
