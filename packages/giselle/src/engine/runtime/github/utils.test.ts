import { describe, expect, test } from "vitest";
import { parseCommand, parseGitHubUrl } from "./utils";

describe("parseGitHubUrl", () => {
	// Issue tests
	test("should parse issue URL", () => {
		const result = parseGitHubUrl(
			"https://github.com/giselles-ai/giselle/issues/9",
		);
		expect(result).toEqual({
			owner: "giselles-ai",
			repo: "giselle",
			type: "issue",
			issueNumber: 9,
		});
	});

	test("should parse issue comment URL", () => {
		const result = parseGitHubUrl(
			"https://github.com/giselles-ai/giselle/issues/9#issuecomment-2708745880",
		);
		expect(result).toEqual({
			owner: "giselles-ai",
			repo: "giselle",
			type: "issueComment",
			issueNumber: 9,
			commentId: 2708745880,
		});
	});

	// Pull request tests
	test("should parse pull request URL", () => {
		const result = parseGitHubUrl(
			"https://github.com/giselles-ai/giselle/pull/403",
		);
		expect(result).toEqual({
			owner: "giselles-ai",
			repo: "giselle",
			type: "pullRequest",
			pullNumber: 403,
		});
	});

	test("should parse pull request review comment URL", () => {
		const result = parseGitHubUrl(
			"https://github.com/giselles-ai/giselle/pull/403#discussion_r1984371481",
		);
		expect(result).toEqual({
			owner: "giselles-ai",
			repo: "giselle",
			type: "pullRequestReviewComment",
			pullNumber: 403,
			reviewId: 1984371481,
		});
	});

	// Release tests
	test("should parse release URL", () => {
		const result = parseGitHubUrl(
			"https://github.com/giselles-ai/giselle/releases/tag/studio.giselles.ai%400.7.0",
		);
		expect(result).toEqual({
			owner: "giselles-ai",
			repo: "giselle",
			type: "release",
			tagName: "studio.giselles.ai@0.7.0",
		});
	});

	// Discussion tests
	test("should parse discussion URL", () => {
		const result = parseGitHubUrl(
			"https://github.com/giselles-ai/giselle/discussions/385",
		);
		expect(result).toEqual({
			owner: "giselles-ai",
			repo: "giselle",
			type: "discussion",
			discussionNumber: 385,
		});
	});

	test("should parse discussion comment URL", () => {
		const result = parseGitHubUrl(
			"https://github.com/giselles-ai/giselle/discussions/336#discussioncomment-12181977",
		);
		expect(result).toEqual({
			owner: "giselles-ai",
			repo: "giselle",
			type: "discussionComment",
			discussionNumber: 336,
			commentId: 12181977,
		});
	});

	// Tree tests
	test("should parse tree URL with branch and path", () => {
		const result = parseGitHubUrl(
			"https://github.com/giselles-ai/giselle/tree/main/apps/playground",
		);
		expect(result).toEqual({
			owner: "giselles-ai",
			repo: "giselle",
			type: "tree",
			ref: "main",
			path: "apps/playground",
		});
	});

	test("should parse tree URL with commit hash and path", () => {
		const result = parseGitHubUrl(
			"https://github.com/giselles-ai/giselle/tree/0e4b541c3296c67adb279fd2e4805113e79f972a/apps/playground",
		);
		expect(result).toEqual({
			owner: "giselles-ai",
			repo: "giselle",
			type: "tree",
			ref: "0e4b541c3296c67adb279fd2e4805113e79f972a",
			path: "apps/playground",
		});
	});

	// Commit tests
	test("should parse commit URL", () => {
		const result = parseGitHubUrl(
			"https://github.com/giselles-ai/giselle/commit/0e4b541c3296c67adb279fd2e4805113e79f972a",
		);
		expect(result).toEqual({
			owner: "giselles-ai",
			repo: "giselle",
			type: "commit",
			sha: "0e4b541c3296c67adb279fd2e4805113e79f972a",
		});
	});

	// Error cases
	test("should return null for non-GitHub URLs", () => {
		const result = parseGitHubUrl("https://gitlab.com/owner/repo");
		expect(result).toBeNull();
	});

	test("should return null for invalid GitHub URLs", () => {
		expect(parseGitHubUrl("https://github.com/only-owner")).toBeNull();
		expect(parseGitHubUrl("https://github.com/owner/repo/invalid")).toBeNull();
		expect(
			parseGitHubUrl("https://github.com/owner/repo/issues/invalid"),
		).toBeNull();
	});

	test("should return null for malformed URLs", () => {
		expect(parseGitHubUrl("not-a-url")).toBeNull();
	});

	// Repository root
	test("should handle repository root URL", () => {
		const result = parseGitHubUrl("https://github.com/giselles-ai/giselle");
		expect(result).toEqual({
			owner: "giselles-ai",
			repo: "giselle",
			type: "tree",
			ref: "HEAD",
			path: "",
		});
	});
});

test("parseCommand", () => {
	expect(
		parseCommand(`
/hello\r\n\r\nPlease write a blog.\r\nTheme is free.
`),
	).toStrictEqual({
		callsign: "hello",
		content: "Please write a blog.\nTheme is free.",
	});
});

test("parseCommand2", () => {
	expect(
		parseCommand(`
		/hello\r\nPlease write a blog.\r\nTheme is free.
`),
	).toStrictEqual({
		callsign: "hello",
		content: "Please write a blog.\nTheme is free.",
	});
});

test("parseCommand3", () => {
	expect(
		parseCommand(`
/hello\r\nPlease write a blog.\r\nTheme is free.\r\n\r\nText mood is ....
`),
	).toStrictEqual({
		callsign: "hello",
		content: "Please write a blog.\nTheme is free.\n\nText mood is ....",
	});
});

test("parseCommand4 - with \\n line endings", () => {
	expect(
		parseCommand(`
/hello\n\nPlease write a blog.\nTheme is free.
`),
	).toStrictEqual({
		callsign: "hello",
		content: "Please write a blog.\nTheme is free.",
	});
});

test("parseCommand5 - mixed line endings", () => {
	expect(
		parseCommand(`
/hello\r\n\nPlease write a blog.\r\nTheme is free.
`),
	).toStrictEqual({
		callsign: "hello",
		content: "Please write a blog.\nTheme is free.",
	});
});

test("invalid command format returns null", () => {
	expect(parseCommand("invalid command")).toBe(null);
	expect(parseCommand("giselle hello")).toBe(null);
});

test("command with multiple spaces", () => {
	expect(parseCommand("/giselle    hello   some content")).toStrictEqual({
		callsign: "giselle",
		content: "hello some content",
	});
});

test("command with empty content", () => {
	expect(parseCommand("/giselle\n")).toStrictEqual({
		callsign: "giselle",
		content: "",
	});
});

test("command with no empty line after command", () => {
	expect(parseCommand("/giselle hello content")).toStrictEqual({
		callsign: "giselle",
		content: "hello content",
	});
});
