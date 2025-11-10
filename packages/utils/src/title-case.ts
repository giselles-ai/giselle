import {
	titleCase as libTitleCase,
	type Options as TitleCaseOptions,
} from "title-case";

export function splitIdentifier(str: string): string {
	return str
		.replace(/[_\-/]+/g, " ")
		.replace(/([a-z\d])([A-Z])/g, "$1 $2")
		.replace(/([A-Z]{2,})([A-Z][a-z])/g, "$1 $2")
		.replace(/([A-Za-z])(\d)/g, "$1 $2")
		.replace(/(\d)([A-Za-z])/g, "$1 $2")
		.trim();
}

const ACRONYMS = new Set([
	"API",
	"HTTP",
	"HTTPS",
	"URL",
	"URI",
	"TCP",
	"UDP",
	"ID",
	"UID",
	"UUID",
	"CSS",
	"HTML",
	"XML",
	"JS",
	"TS",
	"CI",
	"CD",
	"CPU",
	"GPU",
	"AI",
	"ML",
	"DB",
]);

const IS_ALL_CAPS = /^[A-Z]{2,}\d*$/;

export function restoreAcronyms(title: string): string {
	return title.replace(/\b([A-Z][a-z]+|[A-Z]{2,}\d*)\b/g, (w) => {
		const upper = w.toUpperCase();
		if (ACRONYMS.has(upper)) return upper;
		if (IS_ALL_CAPS.test(w)) return upper; // e.g., API, HTTP2
		return w;
	});
}

export function capitalizeAfterColon(s: string, locale?: string | string[]) {
	return s.replace(
		/:\s*(\p{L})/gu,
		(_m, ch: string) => `: ${ch.toLocaleUpperCase(locale)}`,
	);
}

export function titleCase(
	input: string,
	options: TitleCaseOptions = {},
): string {
	const split = splitIdentifier(input);
	let titled = libTitleCase(split, options);
	titled = restoreAcronyms(titled);
	titled = capitalizeAfterColon(titled, options?.locale);
	return titled;
}
