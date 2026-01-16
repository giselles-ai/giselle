# OpenAI Model Patterns

Patterns specific to OpenAI models (GPT-5.x family).

## Reasoning Effort Options by Model

| Model | Options | Default |
|-------|---------|---------|
| gpt-5.2, gpt-5.1-thinking | none, low, medium, high, xhigh | none |
| gpt-5.2-codex | low, medium, high, xhigh | medium |
| gpt-5.1-codex | low, medium, high | medium |
| gpt-5, gpt-5-mini, gpt-5-nano | minimal, low, medium, high | medium |

## Text Verbosity Options

| Model | Options | Default |
|-------|---------|---------|
| Codex models | medium (fixed) | medium |
| All other models | low, medium, high | medium |

## Configuration Objects

Use existing configuration objects from the file:

```typescript
// For gpt-5.2 and gpt-5.1-thinking (default: none reasoning)
const gpt52And51ThinkingConfigurations = {
  ...defaultConfigurations,
  reasoningEffort: "none",
};

// For codex models (fixed medium verbosity)
const gpt51CodexConfigurations = {
  ...defaultConfigurations,
  reasoningEffort: "medium",
  textVerbosity: "medium",
};

// For older models (default: medium reasoning)
const defaultConfigurations = {
  temperature: 0.7,
  topP: 1.0,
  presencePenalty: 0.0,
  frequencyPenalty: 0.0,
  textVerbosity: "medium",
  reasoningEffort: "medium",
};
```

## Capability Flags

Standard OpenAI model capabilities:

```typescript
capabilities:
  Capability.ImageFileInput |
  Capability.TextGeneration |
  Capability.OptionalSearchGrounding |
  Capability.Reasoning,
```

Note: `gpt-5-nano` does NOT have `OptionalSearchGrounding`.

## Enum Regex Catch Pattern

Add a regex to catch dated model versions:

```typescript
// For gpt-5.2-codex, catches "gpt-5.2-codex-20260115" etc.
if (/^gpt-5\.2-codex(?:-.+)?$/.test(v)) {
  return "gpt-5.2-codex";
}
```

Important: Place more specific patterns BEFORE general ones.

## UI Configuration Updates

Update `getReasoningEffortOptions()` in `openai.tsx`:

```typescript
function getReasoningEffortOptions(modelId: string): readonly string[] {
  if (modelId === "gpt-5.2" || modelId === "gpt-5.1-thinking") {
    return ["none", "low", "medium", "high", "xhigh"] as const;
  }
  if (modelId === "gpt-5.2-codex") {
    return ["low", "medium", "high", "xhigh"] as const;
  }
  if (modelId === "gpt-5.1-codex") {
    return ["low", "medium", "high"] as const;
  }
  return ["minimal", "low", "medium", "high"] as const;
}
```

Update `getTextVerbosityOptions()`:

```typescript
function getTextVerbosityOptions(modelId: string): readonly string[] {
  if (modelId === "gpt-5.1-codex" || modelId === "gpt-5.2-codex") {
    return ["medium"] as const;
  }
  return ["low", "medium", "high"] as const;
}
```

## Complete Example: Adding gpt-5.3

### 1. Registry (`packages/language-model-registry/src/openai.ts`)

```typescript
"openai/gpt-5.3": defineLanguageModel({
  provider: openaiProvider,
  id: "openai/gpt-5.3",
  name: "GPT-5.3",
  description: "GPT-5.3 is OpenAI's latest flagship model.",
  contextWindow: 500_000,
  maxOutputTokens: 150_000,
  knowledgeCutoff: new Date(2025, 11, 31).getTime(),
  pricing: {
    input: definePricing(2.0),
    output: definePricing(16.0),
  },
  requiredTier: "pro",
  configurationOptions: {
    reasoningEffort: {
      description: reasoningEffortDescription,
      schema: z.enum(["none", "low", "medium", "high", "xhigh"]),
    },
    textVerbosity: {
      description: textVerbosityDescription,
      schema: z.enum(["low", "medium", "high"]),
    },
  },
  defaultConfiguration: {
    reasoningEffort: "none",
    textVerbosity: "medium",
  },
  url: "https://platform.openai.com/docs/models/gpt-5.3",
}),
```

### 2. Language Model (`packages/language-model/src/openai.ts`)

```typescript
// Add to enum
export const OpenAILanguageModelId = z.enum([
  "gpt-5.3",  // Add first (newest)
  "gpt-5.2",
  "gpt-5.2-codex",
  // ...
])

// Add regex catch (before gpt-5.2 pattern)
if (/^gpt-5\.3(?:-.+)?$/.test(v)) {
  return "gpt-5.3";
}

// Create instance
const gpt53: OpenAILanguageModel = {
  provider: "openai",
  id: "gpt-5.3",
  capabilities:
    Capability.ImageFileInput |
    Capability.TextGeneration |
    Capability.OptionalSearchGrounding |
    Capability.Reasoning,
  tier: Tier.enum.pro,
  configurations: gpt52And51ThinkingConfigurations,
};

// Add to models array (first position)
export const models = [gpt53, gpt52, gpt52codex, ...];
```

### 3. Pricing (`packages/language-model/src/costs/model-prices.ts`)

```typescript
"gpt-5.3": {
  prices: [
    {
      validFrom: "2026-01-15T00:00:00Z",
      price: {
        input: { costPerMegaToken: 2.0 },
        output: { costPerMegaToken: 16.0 },
      },
    },
  ],
},
```

### 4. AI SDK Transform

Add `case "openai/gpt-5.3":` to the OpenAI switch block.

### 5. Node Conversion

```typescript
// Short to full
case "gpt-5.3":
  return "openai/gpt-5.3";

// Full to short
case "openai/gpt-5.3":
  return "gpt-5.3";
```

### 6. UI Config

Add to `getReasoningEffortOptions()`:
```typescript
if (modelId === "gpt-5.3" || modelId === "gpt-5.2" || modelId === "gpt-5.1-thinking") {
  return ["none", "low", "medium", "high", "xhigh"] as const;
}
```
