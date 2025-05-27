import type { $ZodIssue } from "@zod/core";
import { describe, expect, it } from "vitest";
import { addAccessorToInput } from "./add-accessor-to-input";

describe("addAccessorToInput", () => {
	it("should add accessor field equal to label when missing", () => {
		const data = {
			inputs: [
				{
					id: "inp_123",
					label: "First Name",
					isRequired: true,
				},
			],
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["inputs", 0, "accessor"],
			message: "Required",
		};

		const result = addAccessorToInput(data, issue);

		expect(result).toEqual({
			inputs: [
				{
					id: "inp_123",
					label: "First Name",
					accessor: "First Name",
					isRequired: true,
				},
			],
		});
	});

	it("should not modify data when issue is not related to accessor", () => {
		const data = {
			inputs: [
				{
					id: "inp_123",
					label: "First Name",
					isRequired: true,
				},
			],
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["inputs", 0, "someOtherField"],
			message: "Required",
		};

		const result = addAccessorToInput(data, issue);

		expect(result).toBe(data);
	});

	it("should not modify data when accessor is already present", () => {
		const data = {
			inputs: [
				{
					id: "inp_123",
					label: "First Name",
					accessor: "custom_accessor",
					isRequired: true,
				},
			],
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["inputs", 0, "accessor"],
			message: "Required",
		};

		const result = addAccessorToInput(data, issue);

		expect(result).toStrictEqual(data);
	});

	it("should handle non-object data", () => {
		const data = "not an object";

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["inputs", 0, "accessor"],
			message: "Required",
		};

		const result = addAccessorToInput(data, issue);

		expect(result).toBe(data);
	});
});
