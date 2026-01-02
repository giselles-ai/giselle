
# Continuity Ledger

## Goal
Add API publishing settings UI to App Entry Node Properties Panel, protected by feature flag for safe production deploy.

## Constraints/Assumptions
- Adhere to `AGENTS.md` and `CLAUDE.md`.
- Use English for all code and documentation unless strictly required otherwise.
- Maintain the "Less is more" philosophy.
- Data structure for API settings will be designed separately (UI-only implementation for now).
- Feature must be behind feature flag for safe production deploy.

## Key decisions
- Initialized `CONTINUITY.md` to track session state.
- Updated `AGENTS.md` with architectural insights from codebase exploration.
- Added API publishing toggle and display section in `app-entry-configured-view.tsx`.
- Used temporary state for API enabled flag (data structure to be determined separately).
- Feature flag `apiPublishing` will protect the new UI.
- Documented Feature Flags usage pattern in `AGENTS.md`.

## State
- Repository is a large monorepo (>10k commits) using pnpm and turbo.
- Architecture involves `apps` (playground, studio) and `packages` (giselle, protocol, etc.).
- API publishing UI implemented with toggle, endpoint display, and API key display with copy functionality.
- Feature Flags documentation added to `AGENTS.md`.

## Done
- Explored workspace structure.
- Analyzed `package.json`, `pnpm-workspace.yaml`.
- Inspected `apps/` and `packages/` contents.
- Verified naming conventions and code style.
- Checked error handling patterns.
- Updated `AGENTS.md` with gathered information.
- Added "Development Philosophy" section from `CLAUDE.md` to `AGENTS.md`.
- Added "Update CONTINUITY.md" to "After Every Code Change" section in `AGENTS.md`.
- Added API publishing toggle to App Entry Node Properties Panel.
- Added API endpoint and authentication key display with copy functionality.
- Documented Feature Flags usage in `AGENTS.md`.
- Implemented `apiPublishing` feature flag:
  - Added `apiPublishingFlag` to `apps/studio.giselles.ai/flags.ts`.
  - Added `apiPublishing` to `FeatureFlagContextValue` in `packages/react/src/feature-flags/context.ts`.
  - Added to `WorkspaceProvider` in `packages/react/src/workspace/provider.tsx`.
  - Added to data-loader in `apps/studio.giselles.ai/app/workspaces/[workspaceId]/data-loader.ts`.
  - Added to playground in `apps/playground/app/workspaces/[workspaceId]/page.client.tsx`.
  - Used flag in `app-entry-configured-view.tsx` to conditionally render API publishing section.

## Now
- Feature flag implementation complete. Ready for PR.

## Next
- Run `pnpm format` to format code.
- Run `pnpm build-sdk` to build SDK packages.
- Run `pnpm check-types` to verify types.
- Create PR and merge.

## Open questions (UNCONFIRMED if needed)
- What should be the actual API endpoint format?
- How should API keys be generated and stored?
- Should API settings be persisted in the App data structure?

## Working set (files/ids/commands)
- `internal-packages/workflow-designer-ui/src/editor/properties-panel/app-entry-node-properties-panel/app-entry-configured-view.tsx`
- `apps/studio.giselles.ai/flags.ts`
- `packages/react/src/feature-flags/context.ts`
- `packages/react/src/workspace/provider.tsx`
- `apps/studio.giselles.ai/app/workspaces/[workspaceId]/data-loader.ts`
- `AGENTS.md`
- `CONTINUITY.md`
