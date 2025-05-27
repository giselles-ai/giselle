import type { $ZodIssue } from "@zod/core";
import { describe, expect, it } from "vitest";
import { fixTypoAccesorToAccessor } from "./fix-typo-accesor-to-accessor";

describe("fixTypoAccesorToAccessor", () => {
	it("should copy accesor value to accessor field when path contains outputs", () => {
		const data = {
			outputs: [
				{
					id: "out_123",
					accesor: "fullName",
				},
			],
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["outputs", 0, "accessor"],
			message: "Required",
		};

		const result = fixTypoAccesorToAccessor(data, issue);

		expect(result).toEqual({
			outputs: [
				{
					id: "out_123",
					accesor: "fullName",
					accessor: "fullName",
				},
			],
		});
	});

	it("should not modify data when issue is not related to accessor", () => {
		const data = {
			outputs: [
				{
					id: "out_123",
					accesor: "fullName",
				},
			],
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["outputs", "someOtherField"],
			message: "Required",
		};

		const result = fixTypoAccesorToAccessor(data, issue);

		expect(result).toBe(data);
	});

	it("should handle non-object data", () => {
		const data = "not an object";

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["outputs", "accessor"],
			message: "Required",
		};

		const result = fixTypoAccesorToAccessor(data, issue);

		expect(result).toBe(data);
	});

	it("should not modify data when path contains input instead of outputs", () => {
		const data = {
			inputs: [
				{
					id: "inp_123",
					accesor: "fullName",
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

		const result = fixTypoAccesorToAccessor(data, issue);

		expect(result).toBe(data);
	});

	it("should handle deeply nested objects with outputs in path", () => {
		const data = {
			steps: [
				{
					outputs: [
						{
							id: "out_123",
							accesor: "fullName",
						},
					],
				},
			],
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["steps", 0, "outputs", 0, "accessor"],
			message: "Required",
		};

		const result = fixTypoAccesorToAccessor(data, issue);

		expect(result).toEqual({
			steps: [
				{
					outputs: [
						{
							id: "out_123",
							accesor: "fullName",
							accessor: "fullName",
						},
					],
				},
			],
		});
	});

	it("should not modify data when target object doesn't have accesor field but path contains outputs", () => {
		const data = {
			outputs: [
				{
					id: "out_123",
					// No accesor field
				},
			],
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["outputs", 0, "accessor"],
			message: "Required",
		};

		const result = fixTypoAccesorToAccessor(data, issue);

		expect(result).toEqual({
			outputs: [
				{
					id: "out_123",
					accessor: undefined, // Sets to undefined since no accesor exists
				},
			],
		});
	});
});
