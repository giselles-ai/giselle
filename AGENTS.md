# Agents.md - Giselle Development Guide

## Project Overview

Giselle is built to design and run AI workflows beyond prompt chains. Not a chat. Not a chain. A system you can run.

### Key Features:

- Visual editor
- Instant execution
- No infra headaches
- Open source — self-host or use our cloud

## Architecture

Giselle is a pnpm + Turborepo monorepo. At a high level:

- **Apps (`apps/*`)**: user-facing Next.js applications.
  - `apps/playground`: standalone/self-host friendly app for running Giselle.
  - `apps/studio.giselles.ai`: the hosted “cloud” app (auth/billing/teams, etc.).
  - `apps/ui.giselles.ai`: UI component showcase/demo app.
- **Public packages (`packages/*`)**: reusable libraries published/consumed across apps.
  - `packages/protocol`: shared domain types/IDs and protocol objects used across the system.
  - `packages/giselle` (`@giselles-ai/giselle`): core engine/SDK surface (workspaces, tasks, generations, triggers, storage/vault integration).
  - `packages/react`: React bindings (hooks/providers), plus React-specific error types.
  - `packages/nextjs`: Next.js integration (server routing/engine wrapper).
  - Supporting packages: storage, vault, web-search, rag, language-model, registries, etc.
- **Internal packages (`internal-packages/*`)**: UI and editor code shared by apps but not intended as public SDK.
  - `internal-packages/ui`: shared UI components.
  - `internal-packages/workflow-designer-ui`: the workflow designer/editor UI (React + Zustand + XYFlow).
- **Tools (`tools/*`)**: one-off utilities (e.g. storage migration).
- **Build & quality tooling**:
  - **pnpm workspaces** (`pnpm-workspace.yaml`) for dependency management.
  - **turbo** (`turbo.json`) orchestrates tasks (`build`, `dev`, `check-types`, `test`, etc.).
  - **Biome** (`biome.json`) formats and lints the codebase.
  - **Vitest** is the primary unit test runner; **Playwright** is used for e2e tests in the studio app.

## Development Workflow

### Prerequisites

- Node.js **22+** (see `docs/vibe/02-nodejs.md`)
- pnpm (repo expects pnpm 10.x; see root `package.json`)

### Common commands (from repo root)

- **Install**: `pnpm install`
- **Run Playground (local)**: `pnpm dev` (root script filters to `playground`)
- **Run Studio (local)**: `pnpm dev:studio.giselles.ai`
- **Build everything**: `pnpm build`
- **Build SDK packages only**: `pnpm build-sdk`
- **Typecheck**: `pnpm check-types`
- **Format/lint (Biome)**: `pnpm format`
- **Unit tests**: `pnpm test`
- **Dead-code/unused export detection**: `pnpm tidy` (uses Knip)

### Per-package workflow

Most work happens inside one app/package at a time. You can run scripts per workspace:

- `pnpm -F playground dev`
- `pnpm -F studio.giselles.ai test`
- `pnpm -F @giselles-ai/giselle test`

### Environment variables

- Apps typically use `.env.local` (see `README.md` and `apps/playground/README.md`).
- Never commit real secrets. Use the Vault/Secrets abstraction for user-provided credentials (see `docs/adr/0003-managing-secrets.md`).

## Key Conventions

### Naming

Follow the conventions already used across the repo:

- **Files/folders**: `kebab-case`
- **React components / classes**: `PascalCase`
- **Variables / functions / methods**: `camelCase`
- **IDs**: string IDs often have a **prefix** that encodes the domain (e.g. `rn-` vs `flrn-`; see `docs/run-ids-explanation.md`).

### Code Style

- **TypeScript-first**: prefer clear types and small, explicit APIs over clever abstractions.
- **Formatting/linting**: Biome is the source of truth. Use `pnpm format`.
  - Indentation is **tabs** (see `biome.json`).
  - Quotes are **double quotes** in JS/TS (see `biome.json`).
- **Monorepo boundaries**:
  - Prefer importing via package entrypoints (workspace packages) over deep relative paths across packages.
  - Keep changes scoped: avoid unrelated formatting/lockfile churn in PRs (see `docs/vibe/03-clean-prs.md`).
- **UI/editor performance**:
  - For the new editor, follow the Zustand selector + equality patterns documented in
    `internal-packages/workflow-designer-ui/src/new-editor/AGENTS.md`.

### Error Handling

- **Fail fast with actionable messages**: validate inputs early and throw errors that help users and developers recover.
- **Use `cause` for error chains**: when rethrowing, preserve the underlying error via `cause`.
- **Cross-package error identification**:
  - In React bindings we use marker Symbols (via `Symbol.for(...)`) so errors can be detected across package versions (see `packages/react/src/errors/*`).
- **API errors should carry context**:
  - Include request/response metadata when safe, and provide a retry hint (e.g. `isRetryable`) when applicable (see `APICallError`).
- **Secrets**:
  - Never log/store plaintext secrets. Encrypt on ingress; decrypt only server-side when needed (see `docs/adr/0003-managing-secrets.md`).


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
