# @giselles-ai/pseudo-tiktoken

A lightweight TypeScript-only library for estimating token counts that approximately align with OpenAI's **tiktoken** (e.g., `gpt-4o-mini`).

## Purpose

This is a **pseudo-implementation** (hence the name) that provides approximate token counting without depending on the actual tiktoken library or WASM. It's designed for:

- **Safe context length estimation**: Ensuring prompts + responses don't exceed model context limits
- **UI display**: Showing approximate token counts like "~XXX tokens"
- **Input splitting/truncation**: Making decisions about when to split or truncate long inputs

> **Important**: This is **not** a complete tiktoken replacement. It's an approximation implementation for estimation purposes.

## Installation

This package is intended for internal use within the Giselle monorepo.

## Usage

### Basic Usage

```typescript
import { countTokens } from "@giselles-ai/pseudo-tiktoken";

const text = "Hello, world! This is a test.";
const tokenCount = countTokens(text);
console.log(`Token count: ${tokenCount}`);
```

### Tokenization (for debugging/visualization)

```typescript
import { tokenize, type PseudoToken } from "@giselles-ai/pseudo-tiktoken";

const text = "Hello, world!";
const tokens: PseudoToken[] = tokenize(text);

for (const token of tokens) {
  console.log(`Token: "${token.text}" at index ${token.index}`);
}
```

## API

### `countTokens(text: string): number`

Counts the number of tokens in the given text.

**Parameters:**
- `text` (string): Input text to count tokens for

**Returns:**
- `number`: Token count

### `tokenize(text: string): PseudoToken[]`

Tokenizes text into pseudo-tokens with position information.

**Parameters:**
- `text` (string): Input text to tokenize

**Returns:**
- `PseudoToken[]`: Array of tokens with `text` and `index` properties

### `normalizeWhitespace(text: string): string`

Normalizes whitespace in text (converts newlines/tabs to spaces, collapses consecutive spaces).

**Parameters:**
- `text` (string): Input text

**Returns:**
- `string`: Normalized text

## How It Works

The tokenizer uses a simplified approach:

1. **Whitespace normalization**: Converts newlines, tabs, and consecutive spaces to single spaces
2. **Lexical splitting**: Splits text into categories:
   - **Whitespace**: Ignored (not counted as tokens)
   - **Punctuation**: Each punctuation character = 1 token
   - **English words**: Alphanumeric words (including apostrophes) are split into subwords
   - **Other characters**: Each character = 1 token (emoji, CJK, etc.)
3. **Subword splitting**: Long English words are split using common suffix patterns (e.g., "tokenization" → "token" + "ization") or fixed-size chunks

## Accuracy

This implementation aims to be **slightly overestimated** rather than underestimated to ensure safe context length management. The accuracy targets are:

- **Absolute error**: Within ±20 tokens
- **Relative error**: Within ±15%

Tests verify that underestimation (counting fewer tokens than tiktoken) is kept below 10% to prevent context length violations.

## Development

### Build

```sh
pnpm build
```

### Type Check

```sh
pnpm check-types
```

### Format

```sh
pnpm format
```

### Test

```sh
pnpm test
```

### Generate True Token Counts

To update the test samples with true token counts from tiktoken:

```sh
pnpm generate-true-tokens
```

This script requires `tiktoken` to be installed as a dev dependency and will output token counts that can be used to update `test/samples.ts`.

## Testing Strategy

The test suite includes:

1. **Accuracy tests** (`test/accuracy.test.ts`): Validates that estimates are within acceptable error bounds
2. **Underestimate tests** (`test/underestimate.test.ts`): Ensures we don't underestimate too much (critical for context length safety)

Test samples are defined in `test/samples.ts` with various text types:
- Simple sentences
- Long text
- Markdown
- Code blocks
- Emoji and special characters
- Mixed languages

## Architecture

```
src/
  index.ts          # Public API exports
  tokenizer.ts      # Main tokenization logic
  rules/
    english.ts      # English subword splitting rules
    punctuation.ts  # Punctuation detection rules
test/
  samples.ts        # Test samples with true token counts
  accuracy.test.ts  # Accuracy validation tests
  underestimate.test.ts # Underestimation prevention tests
scripts/
  generate-true-tokens.ts # Script to generate true tokens using tiktoken
```

## License

MIT

