# Language Model Registry

The primary model definition file. Each provider has its own file.

## File Location

`packages/language-model-registry/src/{provider}.ts`

## Structure

```typescript
"provider/model-id": defineLanguageModel({
  provider: providerObject,
  id: "provider/model-id",
  name: "Display Name",
  description: "Model description from official docs",
  contextWindow: 400_000,
  maxOutputTokens: 128_000,
  knowledgeCutoff: new Date(YEAR, MONTH_0_INDEXED, DAY).getTime(),
  pricing: {
    input: definePricing(COST_PER_MILLION),
    output: definePricing(COST_PER_MILLION),
  },
  requiredTier: "pro" | "free",
  configurationOptions: {
    // Provider-specific options with Zod schemas
  },
  defaultConfiguration: {
    // Default values for each option
  },
  url: "https://docs.example.com/models/model-id",
}),
```

## OpenAI Example

```typescript
"openai/gpt-5.2-codex": defineLanguageModel({
  provider: openaiProvider,
  id: "openai/gpt-5.2-codex",
  name: "GPT-5.2 Codex",
  description:
    "GPT-5.2-Codex is specifically designed for use in Codex and agentic coding tasks.",
  contextWindow: 400_000,
  maxOutputTokens: 128_000,
  knowledgeCutoff: new Date(2025, 7, 31).getTime(), // August 2025
  pricing: {
    input: definePricing(1.75),
    output: definePricing(14.0),
  },
  requiredTier: "pro",
  configurationOptions: {
    reasoningEffort: {
      description: reasoningEffortDescription,
      schema: z.enum(["low", "medium", "high", "xhigh"]),
    },
    textVerbosity: {
      description: textVerbosityDescription,
      schema: z.enum(["medium"]),
    },
  },
  defaultConfiguration: {
    reasoningEffort: "medium",
    textVerbosity: "medium",
  },
  url: "https://platform.openai.com/docs/models/gpt-5.2-codex",
}),
```

## Anthropic Example

```typescript
"anthropic/claude-sonnet-4.5": defineLanguageModel({
  provider: anthropicProvider,
  id: "anthropic/claude-sonnet-4.5",
  name: "Claude Sonnet 4.5",
  description: "Claude Sonnet 4.5 is Anthropic's balanced model.",
  contextWindow: 200_000,
  maxOutputTokens: 64_000,
  knowledgeCutoff: new Date(2025, 3, 1).getTime(),
  pricing: {
    input: definePricing(3.0),
    output: definePricing(15.0),
  },
  requiredTier: "pro",
  configurationOptions: {
    temperature: {
      description: temperatureDescription,
      schema: z.number().min(0).max(1),
    },
    thinking: {
      description: thinkingDescription,
      schema: z.boolean(),
    },
  },
  defaultConfiguration: {
    temperature: 1,
    thinking: false,
  },
  url: "https://docs.anthropic.com/claude/docs/models",
}),
```

## Google Example

```typescript
"google/gemini-3-flash": defineLanguageModel({
  provider: googleProvider,
  id: "google/gemini-3-flash",
  name: "Gemini 3 Flash",
  description: "Google's fast multimodal model.",
  contextWindow: 1_000_000,
  maxOutputTokens: 65_536,
  knowledgeCutoff: new Date(2025, 5, 1).getTime(),
  pricing: {
    input: definePricing(0.5),
    output: definePricing(3.0),
  },
  requiredTier: "pro",
  configurationOptions: {
    temperature: {
      description: temperatureDescription,
      schema: z.number().min(0).max(2),
    },
    thinkingLevel: {
      description: thinkingLevelDescription,
      schema: z.enum(["off", "low", "medium", "high"]),
    },
  },
  defaultConfiguration: {
    temperature: 1,
    thinkingLevel: "medium",
  },
  url: "https://ai.google.dev/gemini-api/docs/models",
}),
```

## Notes

- `knowledgeCutoff`: Use `new Date(YEAR, MONTH, DAY).getTime()`. Month is 0-indexed (0 = January)
- `requiredTier`: Use "free" for models available to all users, "pro" for paid tier
- Place new entries in logical order (newest models first within provider)
