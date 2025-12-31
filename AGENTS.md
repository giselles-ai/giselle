# Agents.md - Giselle Development Guide

## Project Overview

Giselle is built to design and run AI workflows beyond prompt chains. Not a chat. Not a chain. A system you can run.

### Key Features:

- Visual editor
- Instant execution
- No infra headaches
- Open source — self-host or use our cloud

## Architecture

### Monorepo Structure

Giselle uses a pnpm monorepo managed by Turborepo with the following workspace structure:

```
/apps                    # Deployable applications
  /playground            # Local development playground
  /studio.giselles.ai    # Production cloud application
  /ui.giselles.ai        # UI component showcase

/packages                # Shared SDK packages (@giselles-ai/*)
  /giselle               # Core engine - workflow execution, generations, tasks
  /protocol              # Shared data types and schemas (Zod-based)
  /nextjs                # Next.js integration for Giselle engine
  /react                 # React hooks and components for client-side
  /language-model        # LLM provider abstractions
  /language-model-registry # Model and tool configurations
  /rag                   # RAG pipeline (embeddings, chunking, vector stores)
  /github-tool           # GitHub API integration
  /storage               # Storage abstraction layer
  /vault                 # Secret management
  /http                  # HTTP route handlers
  /stream                # Streaming utilities

/internal-packages       # UI packages not published to npm
  /ui                    # Shared UI components (Button, Dialog, etc.)
  /workflow-designer-ui  # Visual workflow editor

/tools                   # Development and migration utilities
```

### Core Layers

1. **Protocol Layer** (`@giselles-ai/protocol`)
   - Defines all data types: Workspace, Node, Connection, Task, Generation, Trigger
   - Uses Zod schemas for runtime validation and TypeScript types
   - Branded ID types (WorkspaceId, NodeId, TaskId, etc.) for type safety

2. **Engine Layer** (`@giselles-ai/giselle`)
   - Core execution engine for AI workflows
   - Manages workspaces, tasks, generations, triggers
   - Provides the `Giselle()` factory function that returns all SDK methods
   - Handles file storage, secrets, and integrations

3. **Integration Layer** (`@giselles-ai/nextjs`)
   - `NextGiselle()` wraps the engine for Next.js deployments
   - HTTP handlers for API routes
   - Provides `after()` integration for background processing

4. **React Layer** (`@giselles-ai/react`)
   - Client-side hooks: `useGiselle()`, `useWorkspace()`, `useTask()`
   - Real-time generation streaming
   - Feature flags and usage limits

5. **UI Layer** (`internal-packages/workflow-designer-ui`)
   - Visual node-based editor using @xyflow/react
   - Zustand stores for performant state management
   - Properties panels for node configuration

### Database

- PostgreSQL with Drizzle ORM
- pgvector extension for embeddings
- Schema defined in `apps/studio.giselles.ai/db/schema.ts`
- Key tables: teams, users, workspaces, apps, tasks, embeddings

### State Management

- **Server**: Workspaces stored as JSON in cloud storage (S3/Supabase)
- **Client**: Zustand stores with selective subscriptions for performance
- **New Editor**: Fine-grained Zustand selectors prevent unnecessary re-renders

## Development Workflow

### Getting Started

```bash
pnpm install              # Install dependencies
pnpm build-sdk            # Build SDK packages (required before running apps)
pnpm dev                  # Start playground at localhost:3000
pnpm dev:studio.giselles.ai  # Start cloud app
```

### Build Commands

```bash
pnpm build-sdk            # Build all @giselles-ai/* packages
pnpm -F playground build  # Build playground app
pnpm -F studio.giselles.ai build  # Build cloud app
```

### Quality Commands

```bash
pnpm format               # Format code with Biome
pnpm check-types          # TypeScript type checking
pnpm tidy                 # Find unused files/dependencies (Knip)
pnpm tidy --fix           # Remove unused files/dependencies
pnpm test                 # Run all tests
```

### After Every Code Change

Run these commands in order:
1. `pnpm format`
2. `pnpm build-sdk`
3. `pnpm check-types`
4. `pnpm tidy`
5. `pnpm test`

### Creating New Packages

Use the Turbo generator:
```bash
pnpm turbo gen
```

### Testing

- Framework: Vitest
- Test files: `*.test.ts` pattern
- Run specific tests: `cd <package-dir> && vitest <file.test.ts>`
- Run package tests: `pnpm -F <package> test`

### Pull Request Guidelines

- Create PRs in meaningful minimum units (even 1 commit or ~20 lines)
- ~500 lines: Consider wrapping up for a PR
- 1000 lines: Maximum threshold
- Feature flags protect unreleased features

## Key Conventions

### Naming

#### File Naming: kebab-case
```
✅ user-profile.ts
✅ api-client.tsx
❌ UserProfile.ts
❌ apiClient.tsx
```

#### Component Naming: PascalCase
```
✅ UserProfile
✅ ApiClient
❌ userProfile
```

#### Variable/Function Naming: camelCase
```
✅ userEmail
✅ calculateTotalPrice()
❌ user_email
```

#### Boolean Naming
Use prefixes: `is`, `has`, `can`, `should`
```
✅ isEnabled, hasPermission, canEdit
✅ isValidUser(), hasActiveSubscription()
❌ status, enabled, valid
```

#### Function Naming
Use verb phrases that describe the action:
```
✅ calculateTotalPrice()
✅ validateUserInput()
✅ fetchWorkspaceTeam()
❌ process()
❌ doStuff()
```

### Code Style

#### Formatting
- **Tool**: Biome (not ESLint/Prettier)
- **Indentation**: Tabs
- **Quotes**: Double quotes for strings
- **Imports**: Organized automatically by Biome

#### TypeScript
- Strict mode enabled
- Avoid `any` types
- Use Zod schemas for runtime validation
- Prefer type inference where clear
- Use branded ID types from protocol package

#### React Patterns
- Functional components with hooks
- Use Zustand for complex state (not Context for high-frequency updates)
- Selective store subscriptions to prevent re-renders
- `React.memo` for stable props only

#### Async Code
- Use async/await over raw promises
- Handle errors with try/catch at appropriate boundaries

#### Server Actions
- Use `"use server"` directive for Next.js server actions
- Validate inputs, throw early for invalid state
- Use `redirect()` for navigation after mutations

### Error Handling

#### General Principles
- **Fail fast**: Validate inputs and throw early
- **Surface actionable errors**: Messages should help users understand what went wrong
- **Preserve error context**: Include relevant data for debugging

#### Custom Error Classes
Domain-specific errors extend a base class:
```typescript
class BaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class UsageLimitError extends BaseError { ... }
```

#### RAG Package Error Pattern
Categorized errors with helper methods:
```typescript
export abstract class RagError extends Error {
  abstract readonly code: string;
  abstract readonly category: "validation" | "database" | "embedding" | ...;
  
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) { ... }
  
  toJSON() { ... }  // Structured error data
}

// Usage
throw DatabaseError.connectionFailed(cause, { host, port });
throw DocumentLoaderError.rateLimited(source, retryAfter);
```

#### HTTP Error Handling
In API routes, catch and convert to appropriate responses:
```typescript
try {
  return await handler(request);
} catch (e) {
  if (e instanceof ZodError) {
    return new Response("Invalid request body", { status: 400 });
  }
  if (UsageLimitError.isInstance(e)) {
    return new Response("Usage limit exceeded", { status: 429 });
  }
  return new Response("Internal Server Error", { status: 500 });
}
```

#### Type Guards
Provide type guard functions for error checking:
```typescript
export function isUsageLimitError(error: unknown): error is UsageLimitError {
  return typeof error === "object" && error !== null && 
         "name" in error && error.name === "UsageLimitError";
}
```

#### Invariants
Use `tiny-invariant` for assertions that should never fail:
```typescript
import invariant from "tiny-invariant";
invariant(siteUrl, "NEXT_PUBLIC_SITE_URL is not set");
```


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
