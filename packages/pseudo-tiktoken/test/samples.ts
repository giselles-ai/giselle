/**
 * Token samples for accuracy testing.
 * Each sample includes text and the true token count from tiktoken (gpt-4o-mini).
 * The trueTokens values should be generated using the generate-true-tokens script.
 */

export type TokenSample = {
	id: string;
	text: string;
	trueTokens: number; // Token count from tiktoken (gpt-4o-mini)
};

export const TOKEN_SAMPLES: TokenSample[] = [
	{
		id: "openai-doc-key-concepts",
		text: `Key concepts
============

Key concepts to understand when working with the OpenAI API.

At OpenAI, protecting user data is fundamental to our mission.`,
		trueTokens: 30, // TODO: Generate using generate-true-tokens script
	},
	{
		id: "simple-sentence",
		text: "The quick brown fox jumps over the lazy dog.",
		trueTokens: 10,
	},
	{
		id: "multiple-sentences",
		text: "Hello, world! This is a test. How are you today?",
		trueTokens: 14,
	},
	{
		id: "with-apostrophes",
		text: "It's a beautiful day. The model's performance is excellent. We're testing tokenization.",
		trueTokens: 17,
	},
	{
		id: "long-words",
		text: "Tokenization is the process of converting text into tokens. The implementation uses subword splitting for better accuracy.",
		trueTokens: 21,
	},
	{
		id: "markdown-headers",
		text: `# Main Title

## Subtitle

### Sub-subtitle

This is regular text.`,
		trueTokens: 17,
	},
	{
		id: "markdown-list",
		text: `Here's a list:
- First item
- Second item
- Third item

And another:
1. Numbered one
2. Numbered two`,
		trueTokens: 30,
	},
	{
		id: "code-block",
		text: `Here's some code:

\`\`\`typescript
function countTokens(text: string): number {
  return tokenize(text).length;
}
\`\`\`

That's the function.`,
		trueTokens: 30,
	},
	{
		id: "with-punctuation",
		text: "Hello, world! How are you? I'm fine; thanks for asking. Let's go: 1, 2, 3...",
		trueTokens: 27,
	},
	{
		id: "with-emoji",
		text: "Hello 👋 world 🌍! This is a test 🧪 with emojis 😊.",
		trueTokens: 18,
	},
	{
		id: "long-text",
		text: `Artificial intelligence has revolutionized many aspects of our daily lives. From voice assistants that help us manage our schedules to recommendation systems that suggest what we might like to watch or buy, AI is everywhere. Machine learning algorithms power these systems, learning from vast amounts of data to make predictions and decisions. Natural language processing enables computers to understand and generate human language, making interactions more natural and intuitive. Computer vision allows machines to interpret and understand visual information, enabling applications like facial recognition and autonomous vehicles. As AI continues to advance, it promises to bring even more transformative changes to how we work, live, and interact with technology.`,
		trueTokens: 123,
	},
	{
		id: "mixed-case",
		text: "OpenAI GPT-4o-mini is a powerful language model. It uses tiktoken for tokenization.",
		trueTokens: 22,
	},
	{
		id: "with-numbers",
		text: "The price is $99.99. That's 50% off! Call us at 555-1234 or visit example.com.",
		trueTokens: 27,
	},
	{
		id: "quotes-and-brackets",
		text: 'He said "Hello" and [waved] at the {crowd}.',
		trueTokens: 16,
	},
	{
		id: "empty-string",
		text: "",
		trueTokens: 0,
	},
	{
		id: "single-word",
		text: "tokenization",
		trueTokens: 2,
	},
	{
		id: "whitespace-only",
		text: "   \n\n\t\t  ",
		trueTokens: 2,
	},
	{
		id: "japanese-english-mixed",
		text: "Hello こんにちは world. This is テスト a test.",
		trueTokens: 12,
	},
	{
		id: "urls-and-links",
		text: "Visit https://example.com/path?query=value for more info. Check out example.org too!",
		trueTokens: 19,
	},
	{
		id: "special-characters",
		text: "Special chars: @#$%^&*()_+-=[]{}|;':\",./<>?",
		trueTokens: 20,
	},
];
