/**
 * Punctuation detection rules for tokenization.
 * These characters are treated as single tokens.
 */

const PUNCTUATION_CHARS = new Set([
	".",
	",",
	"!",
	"?",
	";",
	":",
	"(",
	")",
	"[",
	"]",
	"{",
	"}",
	'"',
	"'",
	"…",
	"/",
	"\\",
	"-",
	"–",
	"—",
	"`",
	"@",
	"#",
	"$",
	"%",
	"^",
	"&",
	"*",
	"+",
	"=",
	"|",
	"~",
	"<",
	">",
	"_",
]);

/**
 * Check if a character is punctuation.
 */
export function isPunctuation(char: string): boolean {
	return PUNCTUATION_CHARS.has(char);
}
