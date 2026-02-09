# UI Configuration

Update UI selectors when models have unique configuration options.

## File Location

`internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/model/{provider}.tsx`

## When Updates Are Needed

Update UI config when the model has:
- Different reasoning effort options than existing models
- Different verbosity options than existing models
- New configuration options not supported by the UI

## OpenAI: Reasoning Effort Options

```typescript
function getReasoningEffortOptions(modelId: string): readonly string[] {
  // GPT-5.2 family with none option
  if (modelId === "gpt-5.2" || modelId === "gpt-5.1-thinking") {
    return ["none", "low", "medium", "high", "xhigh"] as const;
  }
  // GPT-5.2 Codex (no none option)
  if (modelId === "gpt-5.2-codex") {
    return ["low", "medium", "high", "xhigh"] as const;
  }
  // GPT-5.1 Codex (no xhigh option)
  if (modelId === "gpt-5.1-codex") {
    return ["low", "medium", "high"] as const;
  }
  // Older models use minimal instead of none
  return ["minimal", "low", "medium", "high"] as const;
}
```

## OpenAI: Text Verbosity Options

```typescript
function getTextVerbosityOptions(modelId: string): readonly string[] {
  // Codex models have fixed medium verbosity
  if (modelId === "gpt-5.1-codex" || modelId === "gpt-5.2-codex") {
    return ["medium"] as const;
  }
  return ["low", "medium", "high"] as const;
}
```

## Model Defaults

**File**: `internal-packages/workflow-designer-ui/.../model/model-defaults.ts`

Update if the model needs a non-standard default reasoning effort:

```typescript
function getDefaultReasoningEffort(modelId: string): string {
  // GPT-5.2 and GPT-5.1-thinking default to "none" for lower latency
  if (modelId === "gpt-5.2" || modelId === "gpt-5.1-thinking") {
    return "none";
  }
  // All other models default to "medium"
  return "medium";
}
```

## Adding New Configuration Types

If the model has a completely new configuration option:

1. Add the option to the registry schema in `packages/language-model-registry/src/{provider}.ts`
2. Add UI controls in the provider's panel component
3. Handle the option in `transform-giselle-to-ai-sdk.ts`

## Notes

- Update JSDoc comments when adding new model patterns
- Keep conditions ordered from most specific to most general
- Test UI renders correctly with `pnpm dev:studio.giselles.ai`
