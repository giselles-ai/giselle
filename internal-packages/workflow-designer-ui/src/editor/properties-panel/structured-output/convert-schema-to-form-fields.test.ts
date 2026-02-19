import type { Schema } from "@giselles-ai/protocol";
import { describe, expect, it } from "vitest";
import { convertSchemaToFormFields } from "./convert-schema-to-form-fields";

describe("convertSchemaToFormFields", () => {
	it("converts JSON Schema to form fields", () => {
		const schema: Schema = {
			title: "Output",
			type: "object",
			properties: {
				title: { type: "string", description: "The title" },
				count: { type: "number" },
				status: { type: "string", enum: ["active", "inactive"] },
				address: {
					type: "object",
					properties: {
						city: { type: "string" },
					},
					required: ["city"],
					additionalProperties: false,
				},
				tags: {
					type: "array",
					items: { type: "string" },
				},
			},
			required: ["title", "count", "status", "address", "tags"],
			additionalProperties: false,
		};

		const result = convertSchemaToFormFields(schema);

		expect(result.title).toBe("Output");
		expect(result.fields).toMatchObject([
			{ name: "title", type: "string", description: "The title" },
			{ name: "count", type: "number" },
			{ name: "status", type: "enum", enumValues: ["active", "inactive"] },
			{
				name: "address",
				type: "object",
				children: [{ name: "city", type: "string" }],
			},
			{ name: "tags", type: "array", items: { type: "string" } },
		]);
	});
});
