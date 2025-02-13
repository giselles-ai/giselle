import { expect, test } from "vitest";
import { parseCommand } from "./command";

test("parseCommand", () => {
	expect(
		parseCommand(`
/giselle hello\r\n\r\nPlease write a blog.\r\nTheme is free.
`),
	).toStrictEqual({
		callSign: "hello",
		content: "Please write a blog.\nTheme is free.",
	});
});

test("parseCommand2", () => {
	expect(
		parseCommand(`
		/giselle hello\r\nPlease write a blog.\r\nTheme is free.
`),
	).toStrictEqual({
		callSign: "hello",
		content: "Please write a blog.\nTheme is free.",
	});
});

test("parseCommand3", () => {
	expect(
		parseCommand(`
/giselle hello\r\nPlease write a blog.\r\nTheme is free.\r\n\r\nText mood is ....
`),
	).toStrictEqual({
		callSign: "hello",
		content: "Please write a blog.\nTheme is free.\n\nText mood is ....",
	});
});

test("parseCommand4 - with \\n line endings", () => {
	expect(
		parseCommand(`
/giselle hello\n\nPlease write a blog.\nTheme is free.
`),
	).toStrictEqual({
		callSign: "hello",
		content: "Please write a blog.\nTheme is free.",
	});
});

test("parseCommand5 - mixed line endings", () => {
	expect(
		parseCommand(`
/giselle hello\r\n\nPlease write a blog.\r\nTheme is free.
`),
	).toStrictEqual({
		callSign: "hello",
		content: "Please write a blog.\nTheme is free.",
	});
});

test("invalid command format returns null", () => {
	expect(parseCommand("invalid command")).toBe(null);
	expect(parseCommand("/invalid hello")).toBe(null);
	expect(parseCommand("giselle hello")).toBe(null);
});

test("command with multiple spaces", () => {
	expect(parseCommand("/giselle    hello   \nsome content")).toStrictEqual({
		callSign: "hello",
		content: "some content",
	});
});

test("command with empty content", () => {
	expect(parseCommand("/giselle hello\n")).toStrictEqual({
		callSign: "hello",
		content: "",
	});
});

test("command with no empty line after command", () => {
	expect(parseCommand("/giselle hello content")).toStrictEqual({
		callSign: "hello",
		content: "content",
	});
});
