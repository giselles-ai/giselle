# Model Pricing

Pricing data for cost calculations.

## File Location

`packages/language-model/src/costs/model-prices.ts`

## Structure

```typescript
"model-id": {
  prices: [
    {
      validFrom: "YYYY-MM-DDTHH:MM:SSZ",  // ISO 8601 timestamp
      price: {
        input: { costPerMegaToken: X.XX },   // USD per 1M tokens
        output: { costPerMegaToken: X.XX },  // USD per 1M tokens
      },
    },
  ],
},
```

## Pricing Tables

Add to the appropriate table based on provider:

| Provider | Table Name |
|----------|------------|
| OpenAI | `openAiTokenPricing` |
| Anthropic | `anthropicTokenPricing` |
| Google | `googleTokenPricing` |

## Example Entries

### OpenAI

```typescript
export const openAiTokenPricing: ModelPriceTable = {
  "gpt-5.2": {
    prices: [
      {
        validFrom: "2025-12-10T00:00:00Z",
        price: {
          input: { costPerMegaToken: 1.75 },
          output: { costPerMegaToken: 14.0 },
        },
      },
    ],
  },
  // Add new model here...
};
```

### Anthropic

```typescript
export const anthropicTokenPricing: ModelPriceTable = {
  "claude-opus-4.5": {
    prices: [
      {
        validFrom: "2025-11-25T00:00:00Z",
        price: {
          input: { costPerMegaToken: 5.0 },
          output: { costPerMegaToken: 25.0 },
        },
      },
    ],
  },
};
```

### Google

```typescript
export const googleTokenPricing: ModelPriceTable = {
  "gemini-3-flash": {
    prices: [
      {
        validFrom: "2025-12-19T00:00:00Z",
        price: {
          input: { costPerMegaToken: 0.5 },
          output: { costPerMegaToken: 3.0 },
        },
      },
    ],
  },
};
```

## Notes

- Use the model's short ID (without provider prefix)
- `validFrom` should be the model's release date
- Prices are in USD per 1,000,000 tokens
- Multiple price entries support historical pricing changes
