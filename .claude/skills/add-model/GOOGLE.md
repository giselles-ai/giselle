# Google Model Patterns

Patterns specific to Google models (Gemini family).

## Configuration Options

Google models have different configs based on version:

### Gemini 3.x (thinkingLevel)
- `temperature`: Number 0-2 (default: 1)
- `thinkingLevel`: "off", "low", "medium", "high" (default: "medium")

### Gemini 2.5.x (thinking boolean)
- `temperature`: Number 0-2 (default: 1)
- `thinking`: Boolean (default: true)

## Registry Example (Gemini 3.x)

```typescript
"google/gemini-3-pro": defineLanguageModel({
  provider: googleProvider,
  id: "google/gemini-3-pro",
  name: "Gemini 3 Pro",
  description: "Google's most capable model.",
  contextWindow: 2_000_000,
  maxOutputTokens: 65_536,
  knowledgeCutoff: new Date(2025, 10, 1).getTime(),
  pricing: {
    input: definePricing(2.5),
    output: definePricing(15.0),
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

## Registry Example (Gemini 2.5.x)

```typescript
"google/gemini-2.5-pro": defineLanguageModel({
  provider: googleProvider,
  id: "google/gemini-2.5-pro",
  name: "Gemini 2.5 Pro",
  description: "Google's balanced reasoning model.",
  contextWindow: 1_000_000,
  maxOutputTokens: 65_536,
  knowledgeCutoff: new Date(2025, 5, 1).getTime(),
  pricing: {
    input: definePricing(1.25),
    output: definePricing(10.0),
  },
  requiredTier: "pro",
  configurationOptions: {
    temperature: {
      description: temperatureDescription,
      schema: z.number().min(0).max(2),
    },
    thinking: {
      description: thinkingDescription,
      schema: z.boolean(),
    },
  },
  defaultConfiguration: {
    temperature: 1,
    thinking: true,
  },
  url: "https://ai.google.dev/gemini-api/docs/models",
}),
```

## AI SDK Transform

### Gemini 3.x (thinkingLevel)

```typescript
case "google/gemini-3-pro-preview":
case "google/gemini-3-flash": {
  const config = parseConfiguration(
    languageModel,
    content.languageModel.configuration,
  );
  return {
    temperature: config.temperature,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingLevel: config.thinkingLevel,
        },
      },
    },
  };
}
```

### Gemini 2.5.x (thinking boolean)

```typescript
case "google/gemini-2.5-flash":
case "google/gemini-2.5-pro": {
  const config = parseConfiguration(
    languageModel,
    content.languageModel.configuration,
  );
  return {
    temperature: config.temperature,
    providerOptions: {
      google: {
        thinkingConfig: {
          // -1 = dynamic thinking, 0 = disabled
          thinkingBudget: config.thinking ? -1 : 0,
        },
      },
    },
  };
}
```

## Naming Convention

Google model IDs follow the pattern:
- `gemini-{version}-{tier}` e.g., `gemini-3-flash`, `gemini-2.5-pro`

In the registry, prefix with `google/`:
- `google/gemini-3-flash`
