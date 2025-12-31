# Agents.md - Giselle Development Guide

## Project Overview

Giselle is built to design and run AI workflows beyond prompt chains. Not a chat. Not a chain. A system you can run.

### Key Features:

- Visual editor
- Instant execution
- No infra headaches
- Open source — self-host or use our cloud

## Architecture

Giselle is built as a monorepo using pnpm workspaces and Turbo for build orchestration. The project follows a package-based architecture that separates concerns into distinct, reusable modules.

### Monorepo Structure

- **`apps/`** - Application packages
  - `playground/` - Self-hosted version with core features
  - `studio.giselles.ai/` - Cloud version with authentication, authorization, and payment features
  - `ui.giselles.ai/` - UI component showcase

- **`packages/`** - Core SDK packages (published as `@giselles-ai/*`)
  - `protocol/` - Type definitions and data structures for workspaces, nodes, tasks, triggers
  - `giselle/` - Core engine for executing workflows
  - `language-model/` - Language model abstraction layer
  - `language-model-registry/` - Provider implementations (OpenAI, Anthropic, Google, etc.)
  - `rag/` - Retrieval-Augmented Generation (RAG) functionality
  - `react/` - React hooks and components for Giselle
  - `storage/` - Storage abstraction layer
  - `vault/` - Secret management
  - `github-tool/` - GitHub integration tools
  - `http/` - HTTP utilities
  - `logger/` - Logging utilities
  - `nextjs/` - Next.js integration
  - And more...

- **`internal-packages/`** - Internal packages (not published)
  - `workflow-designer-ui/` - Visual workflow editor components
  - `ui/` - Shared UI components

- **`tools/`** - Development and migration tools

### Key Architectural Patterns

- **Protocol-First Design**: Core data structures are defined in `@giselles-ai/protocol` and shared across all packages
- **Plugin Architecture**: Nodes, triggers, and actions are registered via registry packages (`node-registry`, `trigger-registry`, `action-registry`)
- **Storage Abstraction**: Storage drivers allow switching between different backends (Supabase, Vercel Blob, etc.)
- **Type Safety**: Full TypeScript coverage with strict type checking across packages
- **Build System**: Turbo manages build dependencies and caching for fast incremental builds

## Development Workflow

### Prerequisites

- Node.js 22.14.0 or later
- pnpm 10.16.0 or later

### Initial Setup

1. Install dependencies: `pnpm install`
2. Create environment file: `touch .env.local`
3. Add at least one API key (OpenAI, Anthropic, or Google AI)
4. Start development: `pnpm dev` (playground) or `pnpm dev:studio.giselles.ai` (studio)

### Required Commands After Code Changes

**IMMEDIATE ACTION REQUIRED**: After making code changes, run these commands in order:

1. `pnpm format` - Format code using Biome
2. `pnpm build-sdk` - Build SDK packages (`@giselles-ai/*`)
3. `pnpm check-types` - Type-check the entire project
4. `pnpm tidy` - Check for unused files/dependencies (use `--fix` to auto-remove)
5. `pnpm test` - Run all tests

These commands are also run in CI; PRs will fail if any step fails.

### Common Commands

- `pnpm build` - Build all packages
- `pnpm build-sdk` - Build only SDK packages
- `pnpm check-types` - Type-check all packages
- `pnpm format` - Format code with Biome
- `pnpm tidy` - Diagnose unused files/dependencies
- `pnpm tidy --fix` - Remove unused files/dependencies
- `pnpm test` - Run all tests
- `pnpm -F <package> test` - Run tests for a specific package
- `pnpm dev` - Start playground development server
- `pnpm dev:studio.giselles.ai` - Start studio development server

### Pull Request Guidelines

- **Create PRs in meaningful minimum units** - Even 1 commit or ~20 lines of diff is fine
- Feature flags protect unreleased features, so submit PRs for any meaningful unit of work
- After PR submission, create a new branch from the current branch and continue development
- **Size Guidelines**:
  - ~500 lines: Consider wrapping up current work for a PR
  - 1000 lines: Maximum threshold - avoid exceeding this
  - Large diffs are acceptable when API + UI changes are coupled, but still aim to break down when possible

### Build System

Giselle uses Turbo for build orchestration. Build tasks are defined in `turbo.json` and respect package dependencies. Turbo caches build outputs for fast incremental builds.

## Key Conventions

### Naming

Follow consistent naming conventions throughout the codebase:

- **File Naming: kebab-case**
  - All filenames should use kebab-case (lowercase with hyphens)
  - Examples: `user-profile.ts`, `api-client.tsx`
  - Avoid: `UserProfile.ts`, `apiClient.tsx`

- **Component Naming: PascalCase**
  - React components and classes should use PascalCase
  - Examples: `UserProfile`, `ApiClient`
  - Avoid: `userProfile`, `user-profile`

- **Variable Naming: camelCase**
  - Variables, functions, and methods should use camelCase
  - Examples: `userEmail`, `isActive`
  - Avoid: `UserEmail`, `user-email`

- **Boolean Variables and Functions**
  - Use prefixes like `is`, `has`, `can`, `should` for clarity
  - Variables: `isEnabled`, `hasPermission` (not `status`)
  - Functions: `isTriggerRequiringCallsign()`, `hasActiveSubscription()` (not `requiresCallsign()` or `checkActive()`)

- **Function Naming**
  - Use verbs or verb phrases that clearly indicate purpose
  - Examples: `calculateTotalPrice()`, `validateUserInput()`
  - Avoid: `process()` (too vague), `doStuff()` (unclear purpose)

- **Consistency**
  - Follow consistent naming patterns across the codebase
  - Use the same terms for the same concepts
  - Maintain consistent casing (camelCase, PascalCase, kebab-case)

### Code Style

- **Formatter**: Biome (configured in `biome.json`)
  - Tab indentation
  - Double quotes for strings
  - Organized imports (auto-organized)
  - Run `pnpm format` or `biome check --write .` to format code

- **TypeScript**
  - Use TypeScript for all code
  - Avoid `any` types; prefer explicit types or `unknown`
  - Use type annotations for clarity, especially for function parameters and return types
  - Leverage type inference where it improves readability

- **React/Next.js**
  - Use functional components with React hooks
  - Follow Next.js patterns for web applications
  - Use Server Components by default; Client Components only when needed (`"use client"`)

- **Async/Await**
  - Prefer `async/await` over Promise chains
  - Handle errors with try/catch blocks

- **Imports**
  - Organized automatically by Biome
  - Group imports: external packages → internal packages → relative imports

- **Code Philosophy**
  - **Less is more**: Keep implementations small and obvious
  - **Simplicity first**: Prefer the simplest data structures and APIs that work
  - **Avoid needless abstractions**: Refactor only when duplication hurts
  - **Explicit over implicit**: Favor clear, descriptive names and type annotations
  - **Fail fast**: Validate inputs, throw early, and surface actionable errors
  - **Let the code speak**: If you need a multi-paragraph comment, refactor until intent is obvious

### Error Handling

Giselle uses structured error handling with custom error classes that provide context and categorization.

- **Custom Error Classes**
  - Extend base error classes (e.g., `RagError`, `GitHubError`) for domain-specific errors
  - Include error codes, categories, and context information
  - Provide helper methods for common error scenarios

- **Error Categories**
  - Errors are categorized by domain (validation, database, embedding, configuration, operation, etc.)
  - Use category-based error handling for type-safe error checking

- **Error Structure**
  - Include descriptive messages
  - Attach context objects with relevant data
  - Preserve cause chains for debugging
  - Implement `toJSON()` methods for structured error serialization

- **Error Patterns**
  - Throw errors early with clear messages
  - Use helper methods for common error scenarios (e.g., `ValidationError.fromZodError()`)
  - Check error types using type guards (e.g., `isErrorCategory()`, `isErrorCode()`)
  - Handle errors at appropriate boundaries (API routes, service layers)

- **Examples**
  - `packages/rag/src/errors.ts` - Comprehensive error class hierarchy for RAG operations
  - `packages/github-tool/src/errors.ts` - GitHub-specific error classes
  - Use `throw new Error()` for simple cases, custom error classes for domain-specific errors


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
