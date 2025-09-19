const ZERO_WIDTH_CHARACTERS = /\u200B|\u200C|\u200D|\uFEFF/gu;
const HARD_HYPHEN_BREAK = /-\n(?=[\p{L}\p{N}])/gu;
const MULTI_SPACE = /[ \t\f\v]+/g;
const TRAILING_WHITESPACE = /[ \t\f\v]+$/gm;
const MULTI_LINE_BREAKS = /\n{3,}/g;

export function normalizeExtractedText(raw: string): string {
	if (raw.length === 0) {
		return "";
	}
	const normalisedLineEndings = raw.replace(/\r\n?/g, "\n");
	const withoutZeroWidth = normalisedLineEndings.replace(
		ZERO_WIDTH_CHARACTERS,
		"",
	);
	const withoutHyphenBreaks = withoutZeroWidth.replace(HARD_HYPHEN_BREAK, "");
	const collapsedSpaces = withoutHyphenBreaks
		.replace(TRAILING_WHITESPACE, "")
		.replace(MULTI_SPACE, " ")
		.replace(/ ?\n ?/g, "\n")
		.replace(MULTI_LINE_BREAKS, "\n\n");
	const trimmedLines = collapsedSpaces
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n")
		.trim();
	return trimmedLines.normalize("NFKC");
}
