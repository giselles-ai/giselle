import { expect, test } from "bun:test";
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
