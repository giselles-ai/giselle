import { Defuddle } from "defuddle/node";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

describe("Defuddle extraction", () => {
	it("preserves article content when converting HTML to Markdown", async () => {
		const url = "https://example.com/article";
		const window = new Window({ url });
		window.document.body.innerHTML = `<article><h1>Example article</h1><p>This article contains <strong>important information</strong> and a <a href="https://example.com/reference">reference</a> for readers.</p></article>`;
		const result = await Defuddle(window, url, {
			markdown: true,
			useAsync: false,
		});
		expect(result.content).toContain("important information");
		expect(result.content).toContain(
			"[reference](https://example.com/reference)",
		);
		expect(result.content).not.toContain("<p>");
		await window.happyDOM.close();
	});

	it.each([
		`src="https://example.com/image.jpg" alt='caption" onerror="alert(1)'`,
		`src="javascript:alert(1)" alt="caption"`,
	])(
		"does not create executable attributes from extractor input: %s",
		async (attributes) => {
			const url = "https://x.com/example/article/123456789";
			const window = new Window({ url });
			window.document.body.innerHTML = `<div data-testid="twitterArticleReadView"><div data-testid="tweetPhoto"><img ${attributes}></div><div data-testid="twitterArticleRichTextView"><h1 data-testid="twitter-article-title">Article title</h1><div class="public-DraftStyleDefault-block">Article body text</div></div></div>`;
			const result = await Defuddle(window, url, { useAsync: false });
			expect(result.content).toContain("Article body text");
			const output = new Window();
			output.document.body.innerHTML = result.content;
			for (const element of output.document.querySelectorAll("*")) {
				for (const attribute of element.attributes) {
					expect(attribute.name.toLowerCase().startsWith("on")).toBe(false);
					if (["src", "href"].includes(attribute.name.toLowerCase())) {
						expect(
							(attribute.value ?? "").toLowerCase().replace(/\s+/g, ""),
						).not.toContain("javascript:");
					}
				}
			}
			await output.happyDOM.close();
			await window.happyDOM.close();
		},
	);
});
