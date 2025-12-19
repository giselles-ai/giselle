import type { $ZodIssue } from "@zod/core";
import { describe, expect, it } from "vitest";
import { fixInvalidAppParameterId } from "./fix-invalid-app-parameter-id";

describe("fixInvalidAppParameterId", () => {
	it("should replace invalid draftApp.parameters[].id with a valid appprm id", () => {
		const data = {
			content: {
				draftApp: {
					parameters: [
						{
							id: "invalid-id",
							name: "p1",
							type: "text",
							required: true,
						},
					],
				},
			},
		};

		const issue = {
			code: "invalid_format",
			format: "regex",
			pattern: "/^appprm-[0-9A-Za-z]{16}$/",
			path: ["content", "draftApp", "parameters", 0, "id"],
			message:
				'ID must start with "appprm-" followed by 16 alphanumeric characters',
		} as unknown as $ZodIssue;

		const result = fixInvalidAppParameterId(data, issue) as typeof data;
		expect(result).not.toBe(data);
		expect(result.content.draftApp.parameters[0].id).toMatch(
			/^appprm-[0-9A-Za-z]{16}$/,
		);
	});

	it("should return data unchanged for non-matching issues", () => {
		const data = { someOtherData: "value" };
		const issue = {
			code: "invalid_type",
			path: ["someOtherData"],
			message: "Invalid type",
		} as unknown as $ZodIssue;

		const result = fixInvalidAppParameterId(data, issue);
		expect(result).toBe(data);
	});
});
