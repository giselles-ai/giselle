# Continuity Ledger

## Goal
Refactor `packages/sdk` and `apps/studio.giselles.ai/app/api/apps` to use primitive APIs from `packages/giselle` and standardized types from `packages/protocol`.

## Context
- The user wants to improve the SDK implementation which currently relies on ad-hoc response types from the API.
- The API should act as a facade for `packages/giselle` primitives.
- The SDK should handle response transformation using `packages/protocol` types.

## Plan
1.  **Explore**: Analyze current implementations in `packages/sdk`, `apps/studio.giselles.ai/app/api/apps`, and `packages/giselle`.
2.  **Refactor API**: Update the route handler to return primitive responses.
3.  **Refactor SDK**: Update the SDK to consume primitive responses and transform them.
4.  **Verify**: Ensure types are correct and build passes.

## State
- **Status**: Starting exploration.
- **Current Task**: Explore codebase.
