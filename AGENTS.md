# Agents.md - Giselle Development Guide

## Project Overview

Giselle is built to design and run AI workflows beyond prompt chains. Not a chat. Not a chain. A system you can run.

### Key Features:

- Visual editor
- Instant execution
- No infra headaches
- Open source — self-host or use our cloud

## Architecture

Giselle follows a monorepo architecture using pnpm workspaces and Turbo for build orchestration. The project is organized into three main categories:

### Package Structure

- **`packages/`** - Core SDK packages published as `@giselles-ai/*`
  - `@giselles-ai/giselle` - Main engine for executing workflows
  - `@giselles-ai/protocol` - Type definitions and data structures
  - `@giselles-ai/language-model` - Language model abstractions
  - `@giselles-ai/rag` - Retrieval-Augmented Generation functionality
  - `@giselles-ai/storage` - Storage abstraction layer
  - `@giselles-ai/vault` - Secret management
  - `@giselles-ai/logger` - Logging utilities
  - And more specialized packages (github-tool, web-search, etc.)

- **`apps/`** - Application implementations
  - `playground` - Self-hosted version
  - `studio.giselles.ai` - Cloud version (Giselle Cloud)
  - `ui.giselles.ai` - UI component showcase

- **`internal-packages/`** - Internal packages not published
  - `workflow-designer-ui` - Visual workflow editor components
  - `ui` - Shared UI components

### Key Architectural Patterns

- **Package-based modularity** - Each package has a single responsibility
- **Protocol-driven design** - Core types defined in `@giselles-ai/protocol`
- **Storage abstraction** - Pluggable storage drivers (Supabase, Vercel Blob, etc.)
- **Language model abstraction** - Support for multiple providers (OpenAI, Anthropic, Google, etc.)
- **Task execution engine** - Async task execution with generation queuing
- **Visual editor** - React Flow-based workflow designer

## Development Workflow

### Prerequisites

- Node.js >= 22
- pnpm 10.16.0
- At least one AI provider API key (OpenAI, Anthropic, or Google AI)

### Getting Started

```bash
# Install dependencies
pnpm install

# Create environment file
touch .env.local

# Add API key
echo 'OPENAI_API_KEY="your_key_here"' >> .env.local

# Start development server
pnpm dev  # For playground
pnpm dev:studio.giselles.ai  # For cloud version
```

### Required Commands After Code Changes

After making any code changes, you **must** run these commands in order:

1. `pnpm format` - Format code with Biome
2. `pnpm build-sdk` - Build SDK packages
3. `pnpm check-types` - Type-check the project
4. `pnpm tidy` - Check for unused files/dependencies
5. `pnpm test` - Run tests

These are also enforced in CI - PRs will fail if any step fails.

### CI/CD Pipeline

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and PR:

1. Biome formatting check
2. Knip (unused code detection)
3. SDK build
4. Type checking
5. Color token validation (non-blocking)
6. Tests

### Pull Request Process

- **Create PRs in meaningful minimum units** - Even 1 commit or ~20 lines is fine
- **Size guidelines**: ~500 lines consider wrapping up, 1000 lines maximum
- **After PR submission**: Create a new branch from the current branch to continue development
- Use feature flags for unreleased features

### Common Commands

- `pnpm build-sdk` - Build SDK packages
- `pnpm -F playground build` - Build playground app
- `pnpm -F studio.giselles.ai build` - Build Giselle Cloud
- `pnpm check-types` - Type-check the project
- `pnpm format` - Format code
- `pnpm tidy --fix` - Delete unused files/dependencies
- `pnpm tidy` - Diagnose unused files/dependencies
- `pnpm test` - Run tests

## Key Conventions

### Naming

Follow these naming conventions consistently:

- **Files**: Use kebab-case (e.g., `user-profile.ts`, `api-client.tsx`)
- **Components**: Use PascalCase (e.g., `UserProfile`, `ApiClient`)
- **Variables/Functions**: Use camelCase (e.g., `userEmail`, `isActive`)
- **Boolean variables/functions**: Use prefixes like `is`, `has`, `can`, `should`
  - Variables: `isEnabled`, `hasPermission` (not `status`)
  - Functions: `isTriggerRequiringCallsign()`, `hasActiveSubscription()` (not `requiresCallsign()`)
- **Function naming**: Use verbs or verb phrases that clearly indicate purpose
  - ✅ `calculateTotalPrice()`, `validateUserInput()`
  - ❌ `process()`, `doStuff()`

See `.cursor/rules/naming-guide.mdc` for detailed guidelines.

### Code Style

- **Formatter**: Biome with tab indentation and double quotes
- **TypeScript**: Strict typing, avoid `any` types
- **React**: Functional components with hooks, prefer Next.js patterns
- **Imports**: Organized imports (enabled in biome.json)
- **Async code**: Use async/await rather than promises
- **Tests**: Use Vitest, follow `*.test.ts` naming pattern

Key principles:
- **Simplicity first** - Prefer the simplest data structures and APIs that work
- **Avoid needless abstractions** - Refactor only when duplication hurts
- **Explicit over implicit** - Favor clear, descriptive names and type annotations
- **Fail fast** - Validate inputs, throw early, and surface actionable errors
- **Let the code speak** - If you need a multi-paragraph comment, refactor until intent is obvious

See `.cursor/rules/development-guide.mdc` for detailed guidelines.

### Error Handling

- **Base error classes**: Extend `Error` with custom error classes for different error types
  - Example: `UsageLimitError` extends `BaseError` in `packages/giselle/src/error.ts`
  - RAG package uses structured error classes (`RagError`, `ValidationError`, `DatabaseError`, etc.)
- **Try/catch blocks**: Use try/catch for async operations and error recovery
- **Error propagation**: Propagate errors appropriately - catch, log, and re-throw when necessary
- **Error messages**: Provide clear, actionable error messages
- **Type guards**: Use type guard functions (e.g., `isUsageLimitError()`) for type-safe error handling

Pattern:
```typescript
try {
  // operation
} catch (error) {
  // log or handle
  throw error; // or transform to domain error
}
```

For domain-specific errors, create custom error classes with appropriate context and error codes.


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
