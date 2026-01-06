# Continuity ledger (per-branch)

## Human intent (must not be overwritten)

- Refactor SDK response transformation: API routes should return primitive giselle types, SDK should transform them
- Current: Route handlers define ad-hoc types (ApiStep, ApiOutput) and do transformation
- Desired: API facades giselle, SDK handles transformation to user-friendly format
- Keep SDK public interface stable for consumers

## Goal (incl. success criteria)

- API routes (`/api/apps/[appId]/run`, `/api/apps/[appId]/tasks/[taskId]`) return primitive protocol types
- SDK transforms primitive responses into user-friendly `AppTask`, `AppTaskStep`, `AppTaskOutput` types
- Tests pass, types check

## Constraints/Assumptions

- SDK public API should remain backwards compatible
- Use existing giselle primitive APIs
- Protocol types from `@giselles-ai/protocol` are the source of truth

## Key decisions

- Route handlers return: `{ task: Task, generations?: Record<GenerationId, Generation> }`
- SDK transforms this to the existing `AppTask` shape
- Keep current SDK types as the public interface

## State

- Complete ✓

## Done

- Read SDK, route handlers, giselle facade
- Understand protocol types (Task, Generation)
- Updated `/api/apps/[appId]/tasks/[taskId]/route.ts` to return primitive `{ task, generations }` format
- Added `transformTaskResponse()` in SDK to handle transformation from primitive to user-friendly format
- All quality checks pass: format, build-sdk, check-types, test, tidy

## Now

- Complete

## Next

- N/A

## Open questions (UNCONFIRMED if needed)

- None currently

## Working set (files/ids/commands)

- `packages/sdk/src/sdk.ts` - Add transformation logic
- `apps/studio.giselles.ai/app/api/apps/[appId]/tasks/[taskId]/route.ts` - Return primitive types
- `packages/protocol/src/task/task.ts` - Reference for Task type
- `packages/protocol/src/generation/index.ts` - Reference for Generation type
