/**
 * Token samples for accuracy testing.
 * Each sample includes text and the true token count from tiktoken (gpt-4o-mini).
 * The trueTokens values should be generated using the generate-true-tokens script.
 */

import fs from "node:fs";
import path from "node:path";

type TokenSample = {
	id: string;
	text: string;
	trueTokens: number; // Token count from tiktoken (gpt-4o-mini)
};

const nextJsLlmPath = path.join(__dirname, "nextjs-llm.txt");
let nextJsLlmText = "";

try {
	nextJsLlmText = fs.readFileSync(nextJsLlmPath, "utf-8");
} catch (error) {
	// Ignore error if file doesn't exist (e.g. in CI or if not downloaded)
	// But user said they have it.
	console.warn(`Warning: Could not read ${nextJsLlmPath}`, error);
}

export const TOKEN_SAMPLES: TokenSample[] = [
	{
		id: "openai-doc-key-concepts",
		text: `Key concepts
============

Key concepts to understand when working with the OpenAI API.

At OpenAI, protecting user data is fundamental to our mission.`,
		trueTokens: 30,
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
	{
		id: "production-prompt",
		text: `
		Create the pull request body based on <Analyze changes> and <Guideline> and <Author notes>:

<Analyze changes>- Added billing fields to teams:
  - Database migration 0066 adds two nullable columns to teams: active_subscription_id and active_customer_id.
  - Drizzle schema updated (schema.ts) to expose these as activeSubscriptionId and activeCustomerId.

- Migration meta updated:
  - New migration entry (0066_cuddly_wither) recorded in the journal.
  - New snapshot reflects the added team columns; no other schema changes are introduced.

Why it matters:
- Enables directly associating a team with its currently active Stripe subscription and customer, simplifying billing lookups alongside existing subscriptions and subscription_histories tables.

Breaking changes assessment:
- None expected. Changes are additive and nullable; no existing columns, tables, or interfaces were removed or renamed. </Analyze changes>

<Guiseline><guidelines>

<principles>

<principle>

Keep the Pull Request focused on a single problem or feature and ensure it is thoroughly tested before submission.

</principle>

<principle>

Communicate with the team before starting work; make sure the PR is not duplicating effort and aligns with project goals.

</principle>

<principle>

Adhere to established coding and style conventions to facilitate long‑term maintainability.

</principle>

<principle>

Provide a clear and comprehensive summary to make the review process efficient:contentReference\[oaicite:0\]{index=0}.

</principle>

</principles>

<structure>

<section name="Overview">

Summarize the purpose and motivation for the change. Explain why the problem is being addressed and how it benefits the project.

</section>

<section name="Changes">

Outline the key modifications introduced in the PR. Use bullet points to list significant code changes or new functionality.

</section>

<section name="Testing">

Describe how the changes were verified. Include information about local testing, automated tests, staging environments, or any other relevant validation steps.

</section>

<section name="ReviewNotes">

Highlight specific areas where reviewer feedback is desired. Mention any potential issues or decisions that require attention.

</section>

<section name="RelatedIssues">

Reference any related issues or tasks, providing context for the reviewers.

</section>

</structure>

<style>

<note>

Keep language concise and avoid unnecessary jargon. Strive for clarity so reviewers can quickly grasp the intent of the changes.

</note>

<note>

Use headings and bullet points to organize information logically and make the PR easy to scan.

</note>

<note>

Ensure completeness by including what issue the PR relates to, what changes it introduces, how it was tested, and any points needing scrutiny:contentReference\[oaicite:1\]{index=1}.

</note>

</style>

<additionalConsiderations>

<consideration>

If the changes are large, consider splitting them into multiple smaller Pull Requests for easier review.

</consideration>

<consideration>

Follow any project‑specific PR templates, but adapt them as needed to provide meaningful context and details.

</consideration>

</additionalConsiderations>

</guidelines> </Guideline>

<Author notes>  </Author notes>
		`,
		trueTokens: 655,
	},
	{
		id: "nextjs-llm",
		text: nextJsLlmText,
		trueTokens: 678084,
	},
];
