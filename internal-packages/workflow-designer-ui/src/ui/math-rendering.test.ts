import katex from "katex";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Streamdown } from "streamdown";
import { describe, expect, it } from "vitest";

const unsafeLink = String.raw`\href{javascript:alert(1)}{x}`;

function withPrototypeProperty(key: string, value: unknown, run: () => void) {
	const previous = Object.getOwnPropertyDescriptor(Object.prototype, key);
	Object.defineProperty(Object.prototype, key, {
		configurable: true,
		writable: true,
		value,
	});
	try {
		run();
	} finally {
		if (previous) {
			Object.defineProperty(Object.prototype, key, previous);
		} else {
			Reflect.deleteProperty(Object.prototype, key);
		}
	}
}

function renderMath(expression: string) {
	return renderToStaticMarkup(
		createElement(Streamdown, { mode: "static" }, `$$\n${expression}\n$$`),
	);
}

describe("math rendering", () => {
	it("renders ordinary math through Streamdown", () => {
		const html = renderMath(String.raw`\frac{1}{2} + x^2`);
		expect(html).toContain('class="katex');
		expect(html).toContain("katex-base");
		expect(html).not.toContain("katex-error");
	});

	it("ignores inherited trust but preserves explicit trust", () => {
		expect(
			katex.renderToString(unsafeLink, Object.create({ trust: true })),
		).not.toContain("<a href=");
		expect(katex.renderToString(unsafeLink, { trust: true })).toContain(
			"<a href=",
		);
	});

	it("does not create links through Streamdown with polluted trust", () => {
		withPrototypeProperty("trust", true, () => {
			expect(renderMath(unsafeLink)).not.toContain("<a href=");
		});
	});

	it.each(["default", "processor"])("ignores inherited %s metadata", (key) => {
		withPrototypeProperty(key, key === "processor" ? () => true : true, () => {
			expect(
				katex.renderToString(
					unsafeLink,
					key === "processor" ? { trust: false } : { macros: {} },
				),
			).not.toContain("<a href=");
		});
	});

	it("rejects inherited macro definitions", () => {
		withPrototypeProperty(String.raw`\pollutedmacro`, "Z", () => {
			expect(() =>
				katex.renderToString(String.raw`\pollutedmacro`, { macros: {} }),
			).toThrow(katex.ParseError);
		});
	});
});
