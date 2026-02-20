import { describe, expect, it } from "vitest";
import { convertFormFieldsToSchema } from "./convert-form-fields-to-schema";
import type { FormField } from "./types";

describe("convertFormFieldsToSchema", () => {
	it("converts form fields to JSON Schema", () => {
		const input: FormField[] = [
			{
				id: "1",
				name: "title",
				type: "string",
				description: "The title",
			},
			{
				id: "2",
				name: "count",
				type: "number",
				description: "",
			},
			{
				id: "3",
				name: "status",
				type: "enum",
				description: "",
				enumValues: ["active", "inactive"],
			},
			{
				id: "4",
				name: "address",
				type: "object",
				description: "",
				children: [
					{
						id: "4a",
						name: "city",
						type: "string",
						description: "",
					},
				],
			},
			{
				id: "5",
				name: "tags",
				type: "array",
				description: "",
				items: {
					id: "5a",
					name: "",
					type: "string",
					description: "",
				},
			},
		];

		const schema = convertFormFieldsToSchema("Output", input);

		expect(schema).toEqual({
			title: "Output",
			type: "object",
			properties: {
				title: { type: "string", description: "The title" },
				count: { type: "number" },
				status: {
					type: "string",
					enum: ["active", "inactive"],
				},
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
		});
	});
});
