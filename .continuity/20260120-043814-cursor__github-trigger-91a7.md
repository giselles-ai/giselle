# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

<!--
Write 1–5 bullets capturing the human goal and motivation.
This section is intentionally stable: do not overwrite it when updating the ledger.
-->

- Add a UI/data toggle to control whether the GitHub Trigger Node posts in-progress comments (default on).

## Goal (incl. success criteria)

- Add a toggle in the GitHub Trigger Node properties panel to enable/disable in-progress comments.
- Default behavior remains: in-progress comment is posted unless disabled.
- GitHub event handler respects the new setting.

## Constraints/Assumptions

- Keep existing behavior by default (comment posted).
- Use existing UI patterns in the trigger node properties panel.

## Key decisions

- Store `shouldPostInProgressComment` on GitHub trigger config (default true).

## State

- Toggle UI and config flag added; event handler now respects the flag.

## Done

- Added `shouldPostInProgressComment` to GitHub trigger configuration (default true).
- Added configured-view toggle to update the trigger configuration.
- Guarded in-progress comment creation in GitHub event handlers.
- Preserved the flag on GitHub trigger reconfiguration and defaulted on setup.
- Updated GitHub trigger tests for the new config field.

## Now

- Commit and push changes.

## Next

- 

## Open questions (UNCONFIRMED if needed)

- None.

## Working set (files/ids/commands)

- internal-packages/workflow-designer-ui/src/editor/lib/use-github-trigger.ts
- internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/ui/configured-views/github-trigger-configured-view.tsx
- internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/github-trigger-properties-panel.tsx
- internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/utils/use-trigger-configuration.ts
- packages/protocol/src/trigger/github.ts
- packages/giselle/src/github/event-handlers.ts
- packages/giselle/src/triggers/reconfigure-github-trigger.ts
- packages/giselle/src/github/event-handlers.test.ts
- packages/giselle/src/github/trigger-utils.test.ts
