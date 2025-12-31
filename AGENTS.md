# Agents.md - Giselle Development Guide

## Project Overview

Giselle is built to design and run AI workflows beyond prompt chains. Not a chat. Not a chain. A system you can run.

### Key Features:

- Visual editor
- Instant execution
- No infra headaches
- Open source — self-host or use our cloud

## Architecture

The project is structured as a monorepo using **pnpm workspaces** and **Turbo**.

- **apps/**: End-user applications.
  - `studio.giselles.ai`: The main cloud application (Next.js).
  - `playground`: Development environment for testing the SDK and components.
- **packages/**: Core libraries and shared modules.
  - `giselle`: The core SDK handling workflow execution and state management.
  - `protocol`: Defines the data schema (Zod) for nodes, edges, tasks, and generations.
  - `react`, `nextjs`: Integration bindings.
  - `supabase-driver`: Storage implementation.
- **internal-packages/**: Shared UI components used across apps.
  - `workflow-designer-ui`: The visual editor component (React Flow based).
  - `ui`: Shared design system components.

Data flows from the **Visual Editor** (generating JSON based on `protocol`) to the **Runner** (Giselle SDK), which executes the workflow. State is persisted via storage drivers (e.g., Supabase).

## Development Workflow

- **Package Manager**: `pnpm` (v10.16.0)
- **Build System**: `turbo`
- **Linting & Formatting**: `biome`

### Common Commands
- `pnpm build`: Build all packages.
- `pnpm dev`: Start the development environment (playground).
- `pnpm format`: Format code using Biome.
- `pnpm check-types`: Run type checking.
- `pnpm test`: Run tests (Vitest).

### Release Process
- Uses **Changesets** for versioning and changelogs.
- Run `pnpm changeset` to generate a changeset for your changes.

## Key Conventions

### Naming

Follow the strict naming conventions outlined in `.cursor/rules/naming-guide.mdc`:

- **Files**: `kebab-case.ts`, `kebab-case.tsx`
- **Directories**: `kebab-case`
- **React Components**: `PascalCase`
- **Variables & Functions**: `camelCase`
- **Types & Interfaces**: `PascalCase`

### Code Style

- **Formatter**: **Biome** is the single source of truth for formatting. Always run `pnpm format`.
- **Language**: TypeScript (strict mode).
- **Styling**: Tailwind CSS.
- **State Management**: Zustand for global state, React Context for scoped state.
- **Validation**: Zod for runtime validation and schema definition.
- **Imports**: Use explicit imports and path aliases (e.g., `@giselles-ai/*`) where defined.

### Error Handling

- **Error Classes**: Use custom error classes extending `BaseError` (defined in `packages/giselle/src/error.ts`).
- **Type Guards**: Use exported type guards (e.g., `isUsageLimitError`) to check for specific error types.
- **Propagation**: Errors should be propagated up to the appropriate layer (e.g., API route or UI boundary) for handling and reporting.
- **UI**: Use error boundaries and toast notifications to inform users of errors gracefully.


## Continuity Ledger (compaction-safe)
Maintain a single Continuity Ledger for this workspace in `CONTINUITY.md`. The ledger is the canonical session briefing designed to survive context compaction; do not rely on earlier chat text unless it’s reflected in the ledger.

### Article-writing ledger (separate from the repo ledger)
- Keep using the root `CONTINUITY.md` as the canonical **repository** ledger (build/product decisions, implementation state).
- Use `texts/CONTINUITY.md` as the canonical **article-writing** ledger (drafting state, outline-to-draft progress, publishing constraints).
- When working on the blog post in `texts/*`, update `texts/CONTINUITY.md` in addition to (or instead of) the root ledger, depending on what changed.

### How it works
- At the start of every assistant turn: read `CONTINUITY.md`, update it to reflect the latest goal/constraints/decisions/state, then proceed with the work.
- **After every file edit: update `CONTINUITY.md` immediately** to reflect the change before proceeding to the next task. Skipping this breaks session continuity and makes context unreliable.
- Keep it short and stable: facts only, no transcripts. Prefer bullets. Mark uncertainty as `UNCONFIRMED` (never guess).
- If you notice missing recall or a compaction/summary event: refresh/rebuild the ledger from visible context, mark gaps `UNCONFIRMED`, ask up to 1–3 targeted questions, then continue.

### `functions.update_plan` vs the Ledger
- `functions.update_plan` is for short-term execution scaffolding while you work (a small 3–7 step plan with pending/in_progress/completed).
- `CONTINUITY.md` is for long-running continuity across compaction (the “what/why/current state”), not a step-by-step task list.
- Keep them consistent: when the plan or state changes, update the ledger at the intent/progress level (not every micro-step).

### In replies
- Begin with a brief “Ledger Snapshot” (Goal + Now/Next + Open Questions). Print the full ledger only when it materially changes or when the user asks.

### `CONTINUITY.md` format (keep headings)
- Goal (incl. success criteria):
- Constraints/Assumptions:
- Key decisions:
- State:
- Done:
- Now:
- Next:
- Open questions (UNCONFIRMED if needed):
- Working set (files/ids/commands):
