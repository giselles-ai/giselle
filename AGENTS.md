# Agents.md - Giselle Development Guide

## Project Overview

Giselle is built to design and run AI workflows beyond prompt chains. Not a chat. Not a chain. A system you can run.

### Key Features:

- Visual editor
- Instant execution
- No infra headaches
- Open source — self-host or use our cloud

## Architecture

The project is a monorepo managed with `pnpm` workspaces and `turbo`.

- **Apps**:
  - `apps/studio.giselles.ai`: The main Cloud application (Next.js).
  - `apps/playground`: A Next.js app for testing and self-hosting/development.
  - `apps/ui.giselles.ai`: UI component showcase/service.
- **Packages** (`packages/`):
  - **Core**: `giselle` (SDK), `protocol` (Data types & Schema), `react` (Hooks/Components).
  - **Modules**: `language-model`, `rag`, `storage`, `vault`, `web-search`, `github-tool`, etc.
  - **Drivers**: `supabase-driver` (Storage/DB).
  - **Utils**: `utils`, `logger`, `stream`.
- **Internal** (`internal-packages/`):
  - `workflow-designer-ui`: The visual editor component for constructing flows.
  - `ui`: Shared UI components.

## Development Workflow

- **Setup**: `pnpm install`
- **Development**:
  - `pnpm dev` (Runs `playground` for self-hosted/dev environment).
  - `pnpm dev:studio.giselles.ai` (Runs the Cloud studio app).
- **Quality Assurance**:
  - Build: `pnpm build` (All), `pnpm build-sdk` (Packages).
  - Type Check: `pnpm check-types`.
  - Format/Lint: `pnpm format` (uses Biome).
  - Test: `pnpm test` (uses Vitest).
- **Contribution**:
  - Create feature branches: `feat/feature-name` or `fix/issue-name`.
  - Make atomic commits.
  - Ensure all checks pass (`check-types`, `format`, `test`) before pushing.

## Key Conventions

### Naming

- **Files**: `kebab-case` (e.g., `user-profile.ts`, `api-client.tsx`).
- **Components/Classes**: `PascalCase` (e.g., `UserProfile`, `ApiClient`).
- **Variables/Functions**: `camelCase` (e.g., `userEmail`, `calculateTotalPrice`).
- **Booleans**: Prefix with `is`, `has`, `can`, `should` (e.g., `isEnabled`, `hasPermission`).
- **Functions**: Use verb phrases (e.g., `validateUserInput`).

### Code Style

- **Formatter**: Biome (enforced via `pnpm format`).
  - Indentation: Tabs.
  - Quotes: Double quotes.
  - Imports: Organized automatically.
- **TypeScript**: Strict typing required. Avoid `any`.
- **React**: Functional components with Hooks. Next.js App Router patterns.
- **Async**: Prefer `async/await` over raw Promises.

### Error Handling

- **Pattern**: Use standard `try/catch` blocks.
- **Custom Errors**: Extend the base `Error` class for domain-specific errors (e.g., `class GitHubError extends Error`).
- **Propagation**: Catch errors at the appropriate level or propagate them up.


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
