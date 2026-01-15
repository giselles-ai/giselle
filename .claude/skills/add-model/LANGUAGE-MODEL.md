# Language Model Package

Enum definitions, model instances, and capability flags.

## File Location

`packages/language-model/src/{provider}.ts`

## Three Updates Required

### 1. Add to Enum

```typescript
export const OpenAILanguageModelId = z.enum([
  "new-model",  // Add new model (newest first)
  "gpt-5.2",
  "gpt-5.2-codex",
  // ...existing models
])
```

### 2. Add Regex Catch

Handle dated model versions (e.g., "gpt-5.2-codex-20260115"):

```typescript
.catch((ctx) => {
  const v = ctx.value;

  // More specific patterns first
  if (/^new-model(?:-.+)?$/.test(v)) {
    return "new-model";
  }

  // Then general patterns
  // ...
})
```

### 3. Create Model Instance

```typescript
const newModel: ProviderLanguageModel = {
  provider: "provider-name",
  id: "model-id",
  capabilities: Capability.Flag1 | Capability.Flag2,
  tier: Tier.enum.pro,  // or Tier.enum.free
  configurations: configurationObject,
};

// Add to exports
export const models = [newModel, existingModel1, ...];
```

## Capability Flags

Import from `./base`:

```typescript
import { Capability, LanguageModelBase, Tier } from "./base";
```

Available flags (combine with `|`):

| Flag | Description |
|------|-------------|
| `Capability.ImageFileInput` | Can process images |
| `Capability.TextGeneration` | Can generate text |
| `Capability.OptionalSearchGrounding` | Supports web search |
| `Capability.Reasoning` | Has reasoning capabilities |
| `Capability.Thinking` | Has extended thinking mode |

## Provider Examples

### OpenAI

```typescript
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
```

### Anthropic

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

### Google

```typescript
const gemini3Pro: GoogleLanguageModel = {
  provider: "google",
  id: "gemini-3-pro",
  capabilities:
    Capability.ImageFileInput |
    Capability.TextGeneration |
    Capability.OptionalSearchGrounding |
    Capability.Thinking,
  tier: Tier.enum.pro,
  configurations: defaultConfigurations,
};
```
