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

- Structured output playground (`/structured-output`) with CodeMirror editor, flat schema merging, and previews.
- Flat schema merging implemented: {{variable}} references in `properties` are parsed, their `properties` extracted and merged flat into parent. Key conflicts are detected as errors. `required` arrays are unified.
- StructuredOutputDialog extracted from playground into `@giselle-internal/workflow-designer-ui` as a reusable component with parameterized props (suggestions, variables, initialSchema, onSave).
- OutputFormat section added to both V1 and V2 text generation node properties panels with Toggle + "Set Structured Output" button.
- Schema state is currently local (useState); not yet persisted to protocol.

## Done

- Summarized last week's work from `git log` (2026-02-09 to 2026-02-15, author: Ryo Washizu) for status reporting.
- Design discussion and decisions for structured output feature.
- Added `react-simple-code-editor` to `@giselle-internal/workflow-designer-ui`.
- Replaced `PromptEditor` (`prompt-editor.tsx`) to use `react-simple-code-editor` instead of `TextEditor` (Tiptap). Affects all text generation, image generation, and content generation node prompt fields. HTML escaping applied; @-mention (connections) support deferred.
- Created `/structured-output` playground page with CodeMirror JSON Schema editor.
- Dialog sizing improvements: added `extra-wide` and `full` sizes to `DialogContent`.
- Implemented flat schema merging: `mergeReferencedSchemas` function replaces string substitution (`resolveVariables`). Variables written as keyless `{{var}}` inside `properties` (spread syntax). Referenced schemas are parsed, their `properties` extracted and merged flat into the parent. Key conflicts are detected as errors. `required` arrays are unified from all referenced schemas.
- Shared preprocess functions `replaceVariablesForParsing` / `restoreVariables` used by editor formatting, JSON linter, and merge logic.
- Updated previews: "Merged Schema" (replaces "Variable Resolved") and "Sample JSON from Schema" with red error display.
- Fixed layout shift ("がくっ") on autocomplete selection in StructuredOutputDialog: added `h-[95vh]` to full-size dialog to prevent re-centering when content height changes.
- Extracted `StructuredOutputDialog` into `workflow-designer-ui` (`structured-output-dialog.tsx`) with parameterized props for reuse (suggestions, variables, initialSchema, onSave). For text gen nodes, suggestions/variables are empty (no `@` completion, no merge logic).
- Created `OutputFormat` component (`output-format.tsx`) with Toggle ("Output Format") + "Set Structured Output" button that opens the dialog.
- Added CodeMirror dependencies to `@giselle-internal/workflow-designer-ui`.
- Integrated `OutputFormat` into both V1 (`TextGenerationNodePropertiesPanel`) and V2 (`TextGenerationNodePropertiesPanelV2`) between AdvancedOptions and Output sections.
- Added `generateJsonSchema` API for schema generation with AI (platform-paid path): new Giselle method (`packages/giselle/src/generations/generate-json-schema.ts`), HTTP route (`packages/http/src/router.ts`), React client interface (`packages/react/src/giselle-client.ts`), and Studio internal API wiring (`apps/studio.giselles.ai/lib/internal-api/generations.ts`, `create-giselle-client.ts`).
- Updated reusable `StructuredOutputDialog` UI to include a schema description input and `Generate With AI` button next to `Format`; generated schema replaces editor content in one shot with loading/error handling.

## Now

- Structured output UI integrated into text generation properties panels. Schema editing is functional in the UI but not yet persisted.
- `Generate With AI` for JSON Schema is available in `StructuredOutputDialog` and calls the new `generateJsonSchema` API (no usage-limit attribution).
- Fixed: schema description input field was non-interactive because default props `suggestions = []` and `variables = {}` created new references on each render, causing `editorContainerRef` callback to recreate CodeMirror editor on every keystroke (stealing focus). Replaced with module-level constants `EMPTY_SUGGESTIONS` / `EMPTY_VARIABLES`.

## Next

- Add `generated-object` output type to `packages/protocol/src/generation/output.ts`.
- Add `outputSchema` field to text generation node content in protocol.
- Wire `experimental_output` in `generate-content.ts` (conditional on `outputSchema` presence).
- Persist schema from OutputFormat component to node data via `updateNodeDataContent`.
- Decide whether to expose `Generate With AI` behind a feature flag before rollout (currently available where the dialog is used).
- Add `outputSchemas` DB table and storage CRUD for team-level schema reuse.
- Update end node to support structured output property selection (using flat merge logic).
- Update App API response to include `generated-object` outputs.

## Open questions (UNCONFIRMED if needed)

- What JSON Schema subset do we support? Full spec or a limited subset (object, array, string, number, boolean, enum)?
- When upgrading to AI SDK 6, `experimental_output` becomes `output` — migration path should be straightforward but needs verification.
- Should the flat merge logic be extracted into a shared utility package for use by both the playground and the actual engine?

## Working set (files/ids/commands)

- `apps/studio.giselles.ai/app/(main)/structured-output/page.client.tsx` — playground with flat schema merging
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/structured-output-dialog.tsx` — reusable StructuredOutputDialog component
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/output-format.tsx` — OutputFormat toggle + button section
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/index.tsx` — V1 panel (integrated OutputFormat)
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel-v2/index.tsx` — V2 panel (integrated OutputFormat)
- `packages/protocol/src/generation/output.ts` — add `GeneratedObjectContentOutput`
- `packages/protocol/src/node/` — add `outputSchema` to text generation content
- `packages/giselle/src/generations/generate-content.ts` — wire `experimental_output`
- `packages/http/src/router.ts` — update routes if needed
- `apps/studio.giselles.ai/db/schema.ts` — `outputSchemas` table
- `apps/studio.giselles.ai/` — storage CRUD for schemas
