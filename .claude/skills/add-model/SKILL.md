---
name: add-model
description: Add a new language model to the Giselle codebase. Use when the user wants to add, register, or integrate a new LLM model (OpenAI, Anthropic, Google) into the system.
---

# Add Language Model

Add a new language model to the Giselle codebase with full system consistency.

## Quick Start

1. Gather model specifications (or search web for official docs)
2. Update files in order listed below
3. Run validation: `pnpm format && pnpm build-sdk && pnpm check-types && pnpm tidy && pnpm test`

## Required Information

Before starting, collect:
- **Provider**: openai, anthropic, or google
- **Model ID**: e.g., "gpt-5.3", "claude-opus-5"
- **Context window**: Maximum input tokens
- **Max output tokens**: Maximum output tokens
- **Knowledge cutoff**: Date of training data cutoff
- **Pricing**: Input/output cost per million tokens
- **Capabilities**: Reasoning, image input, web search, etc.
- **Configuration options**: Reasoning effort levels, verbosity, temperature, etc.

## Files to Update (In Order)

### 1. Language Model Registry (Primary Definition)

**File**: `packages/language-model-registry/src/{provider}.ts`

Add the model definition. See [REGISTRY.md](REGISTRY.md) for detailed examples.

### 2. Language Model Package

**File**: `packages/language-model/src/{provider}.ts`

Update three locations:
1. Add to the enum (e.g., `OpenAILanguageModelId`)
2. Add regex catch for dated versions in `.catch()` block
3. Create model instance and add to `models` array

See [LANGUAGE-MODEL.md](LANGUAGE-MODEL.md) for detailed examples.

### 3. Model Pricing

**File**: `packages/language-model/src/costs/model-prices.ts`

Add pricing entry to the appropriate table. See [PRICING.md](PRICING.md).

### 4. AI SDK Transformation

**File**: `packages/giselle/src/generations/v2/language-model/transform-giselle-to-ai-sdk.ts`

Add model ID to the switch case for the provider.

### 5. Node Conversion

**File**: `packages/node-registry/src/node-conversion.ts`

Add bidirectional conversion:
- Short to full: `case "model-id": return "provider/model-id";`
- Full to short: `case "provider/model-id": return "model-id";`

### 6. UI Configuration (If Needed)

**File**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/model/{provider}.tsx`

Update if model has unique configuration options. See [UI-CONFIG.md](UI-CONFIG.md).

## Validation Checklist

Run these commands in order (all must pass):

```bash
pnpm format      # Format code
pnpm build-sdk   # Build SDK packages
pnpm check-types # Verify types
pnpm tidy        # Check for unused code
pnpm test        # Run all tests
```

## Provider-Specific Patterns

See detailed patterns for each provider:
- [OPENAI.md](OPENAI.md) - OpenAI models (GPT-5.x family)
- [ANTHROPIC.md](ANTHROPIC.md) - Anthropic models (Claude family)
- [GOOGLE.md](GOOGLE.md) - Google models (Gemini family)
