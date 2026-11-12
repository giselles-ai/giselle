import { type JSONContent, mergeAttributes } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { jsonContentToPlainText } from "./json-content-to-plain-text";
import { jsonContentToText } from "./json-content-to-text";

describe("Tiptap compatibility", () => {
	it("does not inherit attributes from a JSON __proto__ key", () => {
		for (const input of [
			'{"__proto__":{"onerror":"canary","data-canary":"yes"}}',
			'{"class":"safe","__proto__":{"style":"color:red"}}',
		]) {
			const attrs = mergeAttributes(JSON.parse(input));
			expect(Object.getPrototypeOf(attrs)).toBe(Object.prototype);
			expect(attrs.onerror).toBeUndefined();
			expect(attrs["data-canary"]).toBeUndefined();
			expect(attrs.style).toBeUndefined();
		}
		expect(
			mergeAttributes({ class: "one" }, { class: "two", title: "safe" }),
		).toEqual({ class: "one two", title: "safe" });
	});

	it("preserves saved rich text and Source references in execution prompts", () => {
		const content: JSONContent = {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{ type: "text", text: "日本語 ", marks: [{ type: "bold" }] },
						{
							type: "Source",
							attrs: {
								node: {
									id: "nd_test",
									type: "variable",
									content: { type: "text" },
								},
								outputId: "otp_test",
								path: ["answer"],
							},
						},
					],
				},
				{
					type: "codeBlock",
					attrs: { language: "js" },
					content: [{ type: "text", text: "const x = 1;" }],
				},
			],
		};
		expect(jsonContentToText(content)).toBe(
			"**日本語** {{nd\\_test:otp\\_test:answer}}\n\n    const x = 1;",
		);
		expect(jsonContentToPlainText(content)).toBe(
			"日本語 {{nd_test:otp_test:answer}}\n\nconst x = 1;",
		);
	});
});
