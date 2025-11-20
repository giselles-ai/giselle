/**
 * English subword splitting rules for pseudo-tiktoken.
 * Attempts to mimic BPE-like behavior by splitting words based on common suffixes.
 */

/**
 * Common English suffixes ordered by length (longest first).
 * These are used to split words into subwords.
 */
const COMMON_SUFFIXES = [
	"ization",
	"ations",
	"ation",
	"ingly",
	"ness",
	"ment",
	"tion",
	"able",
	"less",
	"ing",
	"ed",
	"ly",
	"er",
	"es",
	"s",
];

/**
 * Minimum word length to apply subword splitting.
 * Shorter words are kept as single tokens.
 * Increased to match tiktoken behavior better (many common words are 1 token).
 */
const MIN_WORD_LENGTH_FOR_SPLITTING = 7;

/**
 * Chunk size for splitting long words that don't match any suffix pattern.
 * Increased to reduce over-estimation for long texts.
 */
const CHUNK_SIZE = 8;

/**
 * Split an English word into pseudo-subwords.
 * This mimics BPE-like behavior for token estimation.
 *
 * @param word - The word to split (should be alphanumeric, may contain apostrophes and hyphens)
 * @returns Array of subword strings
 */
export function splitIntoSubwords(word: string): string[] {
	// console.log(`Splitting: ${word}, MIN=${MIN_WORD_LENGTH_FOR_SPLITTING}`); // Debug log
	// Words with hyphens are kept as single tokens (e.g., "GPT-4o-mini")
	if (word.includes("-")) {
		return [word];
	}

	// Short words are kept as single tokens
	if (word.length <= MIN_WORD_LENGTH_FOR_SPLITTING) {
		return [word];
	}

	// Try to match common suffixes
	for (const suffix of COMMON_SUFFIXES) {
		if (word.endsWith(suffix) && word.length > suffix.length) {
			const stem = word.slice(0, -suffix.length);
			if (stem.length > 0) {
				return [stem, suffix];
			}
		}
	}

	// If no suffix matches, split into fixed-size chunks
	return splitIntoChunks(word, CHUNK_SIZE);
}

/**
 * Split a word into fixed-size chunks.
 */
function splitIntoChunks(word: string, chunkSize: number): string[] {
	const chunks: string[] = [];
	for (let i = 0; i < word.length; i += chunkSize) {
		chunks.push(word.slice(i, i + chunkSize));
	}
	return chunks;
}
