import type { $ZodIssue } from "@zod/core";
import { describe, expect, it } from "vitest";
import { addWorkspaceIdToOriginRun } from "./add-workspace-id-to-origin-run";

describe("addWorkspaceIdToOriginRun", () => {
	it("should add workspaceId to GenerationOriginRun when missing", () => {
		const data = {
			context: {
				origin: {
					type: "run",
					id: "run-123456",
				},
			},
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["context", "origin", "workspaceId"],
			message: "Required",
		};

		const result = addWorkspaceIdToOriginRun(data, issue);

		expect(result).toEqual({
			context: {
				origin: {
					type: "run",
					id: "run-123456",
					workspaceId: "wrks-9999999999999999",
				},
			},
		});
	});

	it("should extract workspaceId from context when available", () => {
		const data = {
			context: {
				origin: {
					type: "workspace",
					id: "wrks-abcdef",
				},
				someOtherField: {
					origin: {
						type: "run",
						id: "run-123456",
					},
				},
			},
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["context", "someOtherField", "origin", "workspaceId"],
			message: "Required",
		};

		const result = addWorkspaceIdToOriginRun(data, issue);

		expect(result).toEqual({
			context: {
				origin: {
					type: "workspace",
					id: "wrks-abcdef",
				},
				someOtherField: {
					origin: {
						type: "run",
						id: "run-123456",
						workspaceId: "wrks-abcdef",
					},
				},
			},
		});
	});

	it("should not modify data when issue is not related to workspaceId", () => {
		const data = {
			context: {
				origin: {
					type: "run",
					id: "run-123456",
				},
			},
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["context", "origin", "someOtherField"],
			message: "Required",
		};

		const result = addWorkspaceIdToOriginRun(data, issue);

		expect(result).toBe(data);
	});

	it("should not modify data when path doesn't include origin", () => {
		const data = {
			context: {
				someField: {
					id: "run-123456",
					type: "run",
				},
			},
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["context", "someField", "workspaceId"],
			message: "Required",
		};

		const result = addWorkspaceIdToOriginRun(data, issue);

		expect(result).toBe(data);
	});

	it("should not modify data when origin type is not run", () => {
		const data = {
			context: {
				origin: {
					type: "workspace",
					id: "wrks-123456",
				},
			},
		};

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["context", "origin", "workspaceId"],
			message: "Required",
		};

		const result = addWorkspaceIdToOriginRun(data, issue);

		expect(result).toBe(data);
	});

	it("should handle non-object data", () => {
		const data = "not an object";

		const issue: $ZodIssue = {
			code: "invalid_type",
			expected: "string",
			input: "undefined",
			path: ["context", "origin", "workspaceId"],
			message: "Required",
		};

		const result = addWorkspaceIdToOriginRun(data, issue);

		expect(result).toBe(data);
	});
});
