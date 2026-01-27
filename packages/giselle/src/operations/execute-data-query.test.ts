import { describe, expect, it } from "vitest";
import { parameterizeQuery } from "./execute-data-query";

describe("parameterizeQuery", () => {
	it("should replace quoted keyword with SQL placeholder $1", () => {
		const result = parameterizeQuery(
			"SELECT * FROM users WHERE id = '{{nd-xxx:otp-xxx}}'",
			[
				{
					replaceKeyword: "{{nd-xxx:otp-xxx}}",
					value: "'); DROP TABLE users; --",
				},
			],
		);

		expect(result.parameterizedQuery).toBe("SELECT * FROM users WHERE id = $1");
		// displayQuery keeps surrounding quotes, only replaces the keyword content
		expect(result.displayQuery).toBe(
			"SELECT * FROM users WHERE id = ''); DROP TABLE users; --'",
		);
		expect(result.values).toEqual(["'); DROP TABLE users; --"]);
	});

	it("should reuse same placeholder index for duplicate keywords", () => {
		const result = parameterizeQuery(
			"SELECT * FROM users WHERE name = '{{nd-xxx:otp-xxx}}' AND email = '{{nd-xxx:otp-xxx}}'",
			[{ replaceKeyword: "{{nd-xxx:otp-xxx}}", value: "test@example.com" }],
		);

		expect(result.parameterizedQuery).toBe(
			"SELECT * FROM users WHERE name = $1 AND email = $1",
		);
		expect(result.displayQuery).toBe(
			"SELECT * FROM users WHERE name = 'test@example.com' AND email = 'test@example.com'",
		);
		expect(result.values).toEqual(["test@example.com"]);
	});

	it("should handle multiple different keywords", () => {
		const result = parameterizeQuery(
			"SELECT * FROM users WHERE name = '{{nd-aaa:otp-aaa}}' AND age = {{nd-bbb:otp-bbb}}",
			[
				{ replaceKeyword: "{{nd-aaa:otp-aaa}}", value: "John" },
				{ replaceKeyword: "{{nd-bbb:otp-bbb}}", value: "25" },
			],
		);

		expect(result.parameterizedQuery).toBe(
			"SELECT * FROM users WHERE name = $1 AND age = $2",
		);
		expect(result.displayQuery).toBe(
			"SELECT * FROM users WHERE name = 'John' AND age = 25",
		);
		expect(result.values).toEqual(["John", "25"]);
	});

	it("should handle empty string values", () => {
		const result = parameterizeQuery(
			"SELECT * FROM users WHERE name = '{{nd-xxx:otp-xxx}}'",
			[{ replaceKeyword: "{{nd-xxx:otp-xxx}}", value: "" }],
		);

		expect(result.parameterizedQuery).toBe(
			"SELECT * FROM users WHERE name = $1",
		);
		expect(result.displayQuery).toBe("SELECT * FROM users WHERE name = ''");
		expect(result.values).toEqual([""]);
	});

	it("should handle unquoted keyword", () => {
		const result = parameterizeQuery(
			"SELECT * FROM users WHERE age = {{nd-xxx:otp-xxx}}",
			[{ replaceKeyword: "{{nd-xxx:otp-xxx}}", value: "100" }],
		);

		expect(result.parameterizedQuery).toBe(
			"SELECT * FROM users WHERE age = $1",
		);
		expect(result.displayQuery).toBe("SELECT * FROM users WHERE age = 100");
		expect(result.values).toEqual(["100"]);
	});

	it("should handle query without keywords", () => {
		const query = "SELECT * FROM users";

		const result = parameterizeQuery(query, []);

		expect(result.parameterizedQuery).toBe(query);
		expect(result.displayQuery).toBe(query);
		expect(result.values).toEqual([]);
	});
});
