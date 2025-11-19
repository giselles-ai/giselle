import { splitIntoSubwords } from "./rules/english";
import { isPunctuation } from "./rules/punctuation";

/**
 * Regular expression for matching English words (alphanumeric + apostrophes + hyphens).
 * Matches words like "OpenAI", "model's", "tokenization", "GPT-4o-mini".
 * Note: No global flag - we use exec() for matching
 * The pattern matches: alphanumeric parts separated by hyphens or apostrophes
 */
const WORD_RE = /[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/;

/**
 * Normalize whitespace in text.
 * - Converts newlines (\n, \r) and tabs (\t) to spaces
 * - Collapses consecutive spaces into a single space
 */
export function normalizeWhitespace(text: string): string {
	return text
		.replace(/[\n\r\t]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Token representation with position information.
 */
export type PseudoToken = {
	text: string;
	index: number;
};

/**
 * Tokenize text into pseudo-tokens.
 * This is a pseudo-implementation that approximates tiktoken behavior.
 *
 * @param text - Input text to tokenize
 * @returns Array of tokens with their positions
 */
export function tokenize(text: string): PseudoToken[] {
	const normalized = normalizeWhitespace(text);
	const tokens: PseudoToken[] = [];
	let index = 0;

	while (index < normalized.length) {
		const char = normalized[index];

		// Skip whitespace (already normalized to single spaces)
		if (char === " ") {
			index++;
			continue;
		}

		// Try to match a word (alphanumeric + apostrophes) first
		const remaining = normalized.slice(index);
		const wordMatch = WORD_RE.exec(remaining);
		if (wordMatch && wordMatch.index === 0) {
			const word = wordMatch[0];
			// Simple optimization: if the word is very long and looks like base64 or hex, 
			// it's likely fewer tokens than naive splitting.
			// However, we'll stick to subword splitting but maybe increase chunk size.
			
			const subwords = splitIntoSubwords(word);
			for (const subword of subwords) {
				tokens.push({ text: subword, index });
			}
			index += word.length;
			// Reset regex lastIndex for next match
			WORD_RE.lastIndex = 0;
			continue;
		}

		// Punctuation: Merge consecutive identical punctuation
		if (isPunctuation(char)) {
			let end = index + 1;
			while (end < normalized.length && normalized[end] === char) {
				end++;
			}
			tokens.push({ text: normalized.slice(index, end), index });
			index = end;
			continue;
		}

		// Other characters (emoji, CJK, etc.): 1 character = 1 token
		tokens.push({ text: char, index });
		index++;
	}

	return tokens;
}

/**
 * Count the number of tokens in text.
 * This is a pseudo-implementation that approximates tiktoken behavior.
 *
 * @param text - Input text to count tokens for
 * @returns Token count
 */
export function countTokens(text: string): number {
	return tokenize(text).length;
}
