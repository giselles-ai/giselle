# Agents.md - Giselle Development Guide

## Project Overview

Giselle is built to design and run AI workflows beyond prompt chains. Not a chat. Not a chain. A system you can run.

### Key Features:

- Visual editor
- Instant execution
- No infra headaches
- Open source — self-host or use our cloud

## Architecture

Giselle is a **pnpm workspace** + **Turborepo** monorepo.

### Repository layout
- **`apps/*`**: end-user Next.js applications
  - **`apps/playground`**: self-hostable/standalone playground (easiest entry point for external contributors)
  - **`apps/studio.giselles.ai`**: the cloud product (`studio.giselles.ai`) with auth/billing/production integrations
  - **`apps/ui.giselles.ai`**: web UI site/app (Next.js)
- **`packages/*`**: shared TypeScript libraries (published/consumed as `@giselles-ai/*`)
  - Examples: `@giselles-ai/giselle` (core SDK), `@giselles-ai/protocol`, registries (`*-registry`), storage/RAG/web-search utilities, etc.
- **`internal-packages/*`**: shared UI and product packages not meant as public SDK surface
  - Examples: `@giselle-internal/workflow-designer-ui`, `@giselle-internal/ui`
- **`tools/*`**: developer tooling/CLIs used by the repo

### Build & runtime model (high-level)
- **Build orchestration**: Turborepo tasks (`turbo.json`) drive `build`, `dev`, `check-types`, `test`, etc.
- **Type system**: TypeScript across apps and packages.
- **Formatting/linting**: Biome (`biome.json`) with tabs and organized imports.
- **Package compilation**: libraries commonly build via `tsup`; apps build via Next.js.
- **LLM/providers integration**: the codebase relies on the Vercel AI SDK ecosystem (`ai`, `@ai-sdk/*`) plus provider SDKs where needed.

## Development Workflow

### Prerequisites
- **Node.js**: `>= 22` (repo `engines.node`)
- **Package manager**: pnpm (see `packageManager` in root `package.json`)

### Getting started (recommended)
- **Self-hosting playground** (fastest path):
  - Create `.env.local` in the repo root with at least one provider API key (see `apps/playground/README.md`).
  - Install deps: `pnpm install`
  - Run dev: `pnpm turbo dev` (or `pnpm dev` for the playground-filtered dev script)
- **Cloud app**:
  - Requires many environment variables (see `apps/studio.giselles.ai/README.md`)
  - Run dev: `pnpm turbo dev`

### Day-to-day workflow
- **Make small, focused changes**: prefer minimal diffs and single-purpose PRs.
- **Keep the repo clean**:
  - Don’t hand-edit `pnpm-lock.yaml`
  - Don’t change ports/config/env files unless the feature requires it
- **Quality gates (run before you consider a change “done”)**:
  - `pnpm format`
  - `pnpm build-sdk`
  - `pnpm check-types`
  - `pnpm tidy`
  - `pnpm test`

### Releases/versioning (libraries)
- This repo uses **Changesets** (`.changeset/`) for package versioning. Add a changeset when you make a user-facing change to published packages.

## Key Conventions

### Naming

Follow the repo naming conventions (see `.cursor/rules/naming-guide.mdc`):
- **Files**: kebab-case (e.g. `user-profile.ts`)
- **React components / classes**: PascalCase (e.g. `UserProfile`)
- **Variables / functions**: camelCase (e.g. `userEmail`, `calculateTotalPrice`)
- **Booleans**: `is/has/can/should` prefixes (e.g. `isEnabled`, `hasPermission`)

### Code Style

Keep implementations small and explicit (see `CLAUDE.md`: “Less is more”).

- **Formatting**: Biome is the source of truth (`pnpm format`). Don’t fight it—format early and often.
- **TypeScript-first**: prefer clear types at module boundaries and avoid cleverness.
- **Dependencies**:
  - Prefer existing workspace packages (`workspace:*` / `workspace:^`) over adding new third-party deps.
  - When you must add a dependency, add it via pnpm (don’t manually edit lockfiles).
- **Imports**: let Biome organize imports; avoid unused exports/files (validated via `pnpm tidy`).

### Error Handling

Treat errors as part of the product surface.

- **Validate at boundaries**: fail fast for invalid inputs (e.g., API/route boundaries, action/trigger inputs).
- **Actionable messages**: throw/return errors that help the caller fix the issue (what failed + how to resolve).
- **Don’t swallow failures**: if you must catch, either rethrow with context or return a structured error.
- **Log intentionally**: include enough context for debugging, but avoid leaking secrets (API keys, tokens, PII).


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
