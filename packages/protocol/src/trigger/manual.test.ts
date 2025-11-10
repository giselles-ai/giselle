import { describe, expect, test } from "vitest";
import { ManualTrigger } from "./manual";

describe("ManualTrigger", () => {
	test("can parse object does not have staged", () => {
		const manualTriggerLike = {
			provider: "manual",
			event: {
				id: "manual",
				parameters: [],
			},
		};
		const parse = ManualTrigger.safeParse(manualTriggerLike);
		expect(parse.success).toBe(true);
		expect(parse.data?.staged).toBe(false);
	});
});
