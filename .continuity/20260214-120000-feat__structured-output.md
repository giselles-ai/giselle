# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

<!--
Write 1–5 bullets capturing the human goal and motivation.
This section is intentionally stable: do not overwrite it when updating the ledger.
-->

- Add structured output support to text generation nodes using AI SDK's `experimental_output` with `jsonSchema()`.
- Allow users to define JSON Schema on text generation nodes so LLM output is structured (object, not plain text).
- Persist schemas in workspace JSON and provide a team-level reuse mechanism (DB index + Supabase Storage).
- Return structured output with schema in generation results (`generated-object` output type).
- Provide a lightweight code editor (react-simple-code-editor + shiki) for schema editing in the UI.

## Goal (incl. success criteria)

- Text generation nodes can optionally have an `outputSchema` (JSON Schema format).
- When `outputSchema` is set, `streamText` uses `experimental_output: Output.object({ schema: jsonSchema(...) })`.
- Generation output includes new `generated-object` type with `content` (parsed object) and `schema` (JSON Schema).
- Schemas are persisted in workspace JSON (node-level) and optionally saved as team resources (DB: `outputSchemas` table for index, Storage: `output-schemas/{id}/schema.json` for data).
- End node can reference upstream nodes' structured output properties and compose a flat app output schema (no nesting).
- SDK consumers can parse output with their own Zod schema for type safety; Giselle SDK also accepts Zod input and converts to JSON Schema internally.
- UI: lightweight code editor for JSON Schema input with syntax highlighting and preview.

## Constraints/Assumptions

- AI SDK v5.0.101: structured output via `experimental_output` (experimental prefix).
- Storage format is JSON Schema (serializable, universal); Zod is accepted at SDK input layer only.
- No nesting of schemas inside schemas at end node level; flat property expansion only.
- `react-simple-code-editor` already added to `@giselle-internal/workflow-designer-ui`.
- shiki already available in `apps/studio.giselles.ai` for syntax highlighting.

## Key decisions

- **JSON Schema as storage/transport format**: universal, serializable, AI SDK `jsonSchema()` accepts directly.
- **Zod as SDK input option**: `zodToJsonSchema` conversion for DX; consumers don't need to define schema twice.
- **New output type `generated-object`**: discriminated union addition to `GenerationOutput`; keeps `generated-text` unchanged.
- **Output includes schema**: `{ type: "generated-object", content: {...}, schema: {...}, outputId }` — self-contained, no extra API call needed.
- **Team-level schema reuse**: DB `outputSchemas` table (id, teamDbId, timestamps) as index; Storage `output-schemas/{id}/schema.json` with `{ name, schema }`. No team concept in storage.
- **End node output composition**: flat merge of upstream nodes' structured output properties via selection; no nesting; arbitrary properties allowed but empty in output.
- **UI editor**: `react-simple-code-editor` + shiki for lightweight JSON Schema editing with syntax highlighting.
- **No Zod-to-JSON-Schema conversion at read time**: AI SDK validates at generation time; stored content is already valid.

## State

- Branch created. `react-simple-code-editor` dependency added.
- PromptEditor component replaced with `react-simple-code-editor` (no syntax highlighting yet).

## Done

- Design discussion and decisions for structured output feature.
- Added `react-simple-code-editor` to `@giselle-internal/workflow-designer-ui`.
- Replaced `PromptEditor` (`prompt-editor.tsx`) to use `react-simple-code-editor` instead of `TextEditor` (Tiptap). Affects all text generation, image generation, and content generation node prompt fields. HTML escaping applied; @-mention (connections) support deferred.

## Now

- PromptEditor swapped to `react-simple-code-editor`. Ready for shiki syntax highlighting integration.

## Next

- Add shiki syntax highlighting to PromptEditor (JSON mode for schema editing).
- Add `generated-object` output type to `packages/protocol/src/generation/output.ts`.
- Add `outputSchema` field to text generation node content in protocol.
- Wire `experimental_output` in `generate-content.ts` (conditional on `outputSchema` presence).
- Add schema preview component (JSON Schema → placeholder JSON).
- Add `outputSchemas` DB table and storage CRUD for team-level schema reuse.
- Update end node to support structured output property selection.
- Update App API response to include `generated-object` outputs.

## Open questions (UNCONFIRMED if needed)

- Should `shiki` be added to `workflow-designer-ui` package directly, or should the editor component live in `apps/studio.giselles.ai` where shiki is already a dependency?
- What JSON Schema subset do we support? Full spec or a limited subset (object, array, string, number, boolean, enum)?
- How should key collisions be handled when end node merges properties from multiple upstream nodes?
- When upgrading to AI SDK 6, `experimental_output` becomes `output` — migration path should be straightforward but needs verification.

## Working set (files/ids/commands)

- `packages/protocol/src/generation/output.ts` — add `GeneratedObjectContentOutput`
- `packages/protocol/src/node/` — add `outputSchema` to text generation content
- `packages/giselle/src/generations/generate-content.ts` — wire `experimental_output`
- `packages/http/src/router.ts` — update routes if needed
- `internal-packages/workflow-designer-ui/` — JSON Schema editor component
- `apps/studio.giselles.ai/db/schema.ts` — `outputSchemas` table
- `apps/studio.giselles.ai/` — storage CRUD for schemas
