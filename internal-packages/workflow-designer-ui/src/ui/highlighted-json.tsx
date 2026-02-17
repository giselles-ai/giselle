import { useMemo } from "react";

type TokenType =
	| "key"
	| "string"
	| "number"
	| "boolean"
	| "null"
	| "punctuation";

const tokenColors: Record<TokenType, string> = {
	key: "text-[#e06c75]",
	string: "text-[#98c379]",
	number: "text-[#98c379]",
	boolean: "text-[#98c379]",
	null: "text-[#98c379]",
	punctuation: "text-[#e8a0bf]",
};

/**
 * Lightweight JSON syntax highlighter using regex tokenization.
 * Avoids heavy dependencies like shiki or CodeMirror for display-only use.
 */
export function HighlightedJson({
	children,
	className,
}: {
	children: string;
	className?: string;
}) {
	const highlighted = useMemo(() => highlightJson(children), [children]);

	return (
		<pre className={className}>
			<code>{highlighted}</code>
		</pre>
	);
}

const JSON_TOKEN_REGEX =
	/("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|(true|false)\b|(null)\b|([{}[\]:,])/g;

function highlightJson(json: string): React.ReactNode[] {
	const nodes: React.ReactNode[] = [];
	let lastIndex = 0;
	let key = 0;

	for (const match of json.matchAll(JSON_TOKEN_REGEX)) {
		const index = match.index;

		// Add any whitespace/text between tokens
		if (index > lastIndex) {
			nodes.push(json.slice(lastIndex, index));
		}

		const [
			,
			keyMatch,
			stringMatch,
			numberMatch,
			booleanMatch,
			nullMatch,
			punctuationMatch,
		] = match;

		let type: TokenType;
		let text: string;

		if (keyMatch != null) {
			type = "key";
			text = `${keyMatch}:`;
			// Skip the colon in match[0] since we include it
			lastIndex = index + match[0].length;
		} else if (stringMatch != null) {
			type = "string";
			text = stringMatch;
			lastIndex = index + match[0].length;
		} else if (numberMatch != null) {
			type = "number";
			text = numberMatch;
			lastIndex = index + match[0].length;
		} else if (booleanMatch != null) {
			type = "boolean";
			text = booleanMatch;
			lastIndex = index + match[0].length;
		} else if (nullMatch != null) {
			type = "null";
			text = nullMatch;
			lastIndex = index + match[0].length;
		} else {
			type = "punctuation";
			text = punctuationMatch;
			lastIndex = index + match[0].length;
		}

		nodes.push(
			<span key={key++} className={tokenColors[type]}>
				{text}
			</span>,
		);
	}

	// Add any remaining text
	if (lastIndex < json.length) {
		nodes.push(json.slice(lastIndex));
	}

	return nodes;
}
