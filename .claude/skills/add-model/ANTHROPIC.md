# Anthropic Model Patterns

Patterns specific to Anthropic models (Claude family).

## Configuration Options

Anthropic models typically have:
- `temperature`: Number 0-1 (default: 1)
- `thinking`: Boolean for extended thinking mode (default: false)

## Registry Example

```typescript
"anthropic/claude-opus-5": defineLanguageModel({
  provider: anthropicProvider,
  id: "anthropic/claude-opus-5",
  name: "Claude Opus 5",
  description: "Anthropic's most capable model.",
  contextWindow: 200_000,
  maxOutputTokens: 64_000,
  knowledgeCutoff: new Date(2025, 5, 1).getTime(),
  pricing: {
    input: definePricing(6.0),
    output: definePricing(30.0),
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

## Language Model Instance

```typescript
const claudeOpus5: AnthropicLanguageModel = {
  provider: "anthropic",
  id: "claude-opus-5",
  capabilities:
    Capability.ImageFileInput |
    Capability.TextGeneration |
    Capability.Thinking,
  tier: Tier.enum.pro,
  configurations: defaultConfigurations,
};
```

## AI SDK Transform

Anthropic models use the `thinking` configuration:

```typescript
case "anthropic/claude-opus-5": {
  const config = parseConfiguration(
    languageModel,
    content.languageModel.configuration,
  );
  if (config.thinking) {
    return {
      temperature: config.temperature,
      providerOptions: {
        anthropic: {
          thinking: { type: "enabled", budgetTokens: 12000 },
        },
      },
    };
  }
  return {
    temperature: config.temperature,
    providerOptions: {
      anthropic: { thinking: { type: "disabled" } },
    },
  };
}
```

## Naming Convention

Anthropic model IDs follow the pattern:
- `claude-{tier}-{version}` e.g., `claude-opus-4.5`, `claude-sonnet-4.5`

In the registry, prefix with `anthropic/`:
- `anthropic/claude-opus-4.5`
