# AGENTS.md - Giselle Development Guide

## Development Philosophy

### Core Principle: **Less is more**
Keep every implementation as small and obvious as possible.

### Guidelines
- **Simplicity first** – Prefer the simplest data structures and APIs that work
- **Avoid needless abstractions** – Refactor only when duplication hurts
- **Remove dead code early** – `pnpm tidy` scans for unused files/deps and lets you delete them in one command
- **Minimize dependencies** – Before adding a dependency, ask "Can we do this with what we already have?"
- **Consistency wins** – Follow existing naming and file-layout patterns; if you must diverge, document why
- **Explicit over implicit** – Favor clear, descriptive names and type annotations over clever tricks
- **Fail fast** – Validate inputs, throw early, and surface actionable errors
- **Let the code speak** – If you need a multi-paragraph comment, refactor until intent is obvious

## Project Overview

Giselle is built to design and run AI workflows beyond prompt chains. Not a chat. Not a chain. A system you can run.

### Key Features:

- Visual editor
- Instant execution
- No infra headaches
- Open source — self-host or use our cloud

## Architecture

### Monorepo Structure

Giselle uses a **Turborepo monorepo** with pnpm workspaces, organized into four main directories:

```
/workspace
├── apps/                    # Deployable applications
│   ├── playground/          # Self-hosted version (experimental)
│   ├── studio.giselles.ai/  # Giselle Cloud (production)
│   └── ui.giselles.ai/      # UI component showcase
├── packages/                # Published SDK packages (@giselles-ai/*)
├── internal-packages/       # Internal shared packages (@giselle-internal/*)
└── tools/                   # Development utilities
```

### Package Layers

**SDK Packages (`packages/@giselles-ai/*`):**
- `protocol` — Core domain types and schemas (Workspace, Node, Task, Generation)
- `giselle` — Engine implementation (tasks, generations, triggers, integrations)
- `react` — React hooks and components for client integration
- `nextjs` — Next.js integration with route handlers
- `language-model` — Language model abstractions and cost calculations
- `language-model-registry` — Provider-specific model implementations
- `rag` — RAG pipeline (chunking, embedding, querying)
- `github-tool` — GitHub integration utilities

**Internal Packages (`internal-packages/@giselle-internal/*`):**
- `workflow-designer-ui` — Visual workflow editor (React Flow-based)
- `ui` — Shared UI components (Radix-based)

### Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 22+ |
| Package Manager | pnpm 10+ |
| Build System | Turborepo |
| Web Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| State Management | Zustand (editor), SWR (data fetching) |
| Validation | Zod v4 |
| Database | PostgreSQL with Drizzle ORM |
| Vector Store | pgvector |
| Formatting/Linting | Biome |
| Testing | Vitest |
| AI SDK | Vercel AI SDK |

### Data Flow

```
Workspace (JSON) → Protocol Types → Giselle Engine → Task Execution → Generation Output
                                          ↓
                          Language Model Registry → AI Provider APIs
```

### Key Domain Concepts

- **Workspace** — A visual workflow containing nodes and connections
- **Node** — Either an OperationNode (actions, text generation, triggers) or VariableNode (text, files, vector stores)
- **Task** — An executable instance of a workflow with sequences of generations
- **Generation** — A single step execution (created → queued → running → completed/failed)
- **App** — A published workflow entry point with parameters

## Development Workflow

TBD
### Initial Setup

```sh
pnpm install        # Install all dependencies
pnpm build-sdk      # Build SDK packages (required before running apps)
```

### Development Commands

```sh
# Development
pnpm dev                     # Start playground (self-hosted version)
pnpm dev:studio.giselles.ai  # Start Giselle Cloud

# Build
pnpm build-sdk               # Build SDK packages
pnpm -F playground build     # Build playground app
pnpm -F studio.giselles.ai build  # Build Giselle Cloud

# Quality Checks
pnpm format                  # Format code with Biome
pnpm check-types             # Type-check all packages
pnpm test                    # Run all tests
pnpm tidy                    # Find unused files/dependencies
pnpm tidy --fix              # Remove unused files/dependencies
```

### After Every Code Change

Run these commands in order:
1. `pnpm format` — Format code
2. `pnpm build-sdk` — Rebuild SDK packages
3. `pnpm check-types` — Verify types
4. `pnpm tidy` — Check for unused code
5. `pnpm test` — Run tests
6. Update `CONTINUITY.md` — Reflect the change immediately

### Testing

```sh
pnpm test                           # Run all tests
pnpm -F @giselles-ai/giselle test   # Run tests for a specific package
cd packages/giselle && vitest       # Run tests in watch mode
vitest run src/tasks/run-task.test.ts  # Run a specific test file
```

Test files follow the `*.test.ts` naming pattern and use Vitest.

### Pull Request Guidelines

- Create PRs in **meaningful minimum units** — even 1 commit or ~20 lines is fine
- Feature flags protect unreleased features, so submit PRs for any meaningful work
- **~500 lines**: Consider wrapping up for a PR
- **1000 lines**: Maximum threshold — avoid exceeding this

## Key Conventions

### Naming

TBD
**File Names: kebab-case**
```
✅ user-profile.ts
✅ api-client.tsx
✅ text-generation.ts
❌ UserProfile.ts
❌ apiClient.tsx
```

**Components: PascalCase**
```
✅ UserProfile
✅ TextGenerationNode
❌ userProfile
```

**Variables and Functions: camelCase**
```
✅ userEmail
✅ calculateTotalPrice()
✅ validateUserInput()
❌ user_email
```

**Booleans: Prefix with `is`, `has`, `can`, `should`**
```
✅ isEnabled, hasPermission, canEdit, shouldRetry
✅ isCompletedGeneration(), hasActiveSubscription()
❌ enabled, permission, completed
```

**ID Types: Prefixed strings with branded types**
```typescript
// packages/protocol/src/node/base.ts
export const NodeId = createIdGenerator("nd");     // "nd_xxx"
export const InputId = createIdGenerator("inp");   // "inp_xxx"
export const OutputId = createIdGenerator("otp");  // "otp_xxx"
```

### Code Style

TBD
**Formatting (Biome)**
- Tab indentation
- Double quotes for strings
- Organized imports (auto-sorted)

**TypeScript**
- Prefer explicit types over `any`
- Use Zod schemas for runtime validation and type inference:
  ```typescript
  export const Workspace = z.object({
    id: WorkspaceId.schema,
    nodes: z.array(NodeLike),
    connections: z.array(Connection),
  });
  export type Workspace = z.infer<typeof Workspace>;
  ```
- Use discriminated unions for variant types:
  ```typescript
  export const Node = z.discriminatedUnion("type", [
    OperationNode,
    VariableNode,
  ]);
  ```

**React**
- Functional components with hooks
- Zustand for complex state (editor store)
- SWR for server data fetching
- Selective subscriptions to minimize re-renders:
  ```typescript
  // Good: Subscribe only to needed data
  const node = useEditorStore((s) => s.nodesById[nodeId]);
  
  // Bad: Subscribe to entire state
  const state = useEditorStore((s) => s);
  ```

**Async/Await**
- Prefer async/await over raw promises
- Use try/catch for error handling

### Error Handling

TBD
**Custom Error Classes with Symbol Markers**

For cross-package error identification, use Symbol-based instance checking:

```typescript
const marker = "giselle.react.error.APICallError";
const symbol = Symbol.for(marker);

export class APICallError extends ReactError {
  private readonly [symbol] = true;
  
  static isInstance(error: unknown): error is APICallError {
    return ReactError.hasMarker(error, marker);
  }
}
```

**Validation Errors**

Handle Zod validation errors at API boundaries:
```typescript
try {
  return await jsonRoutes[routerPath](giselle)({ input });
} catch (e) {
  if (e instanceof ZodError) {
    return new Response("Invalid request body", { status: 400 });
  }
  return new Response("Internal Server Error", { status: 500 });
}
```

**Exhaustive Type Checking**

Use `never` type for exhaustive switch statements:
```typescript
switch (generation.context.operationNode.content.type) {
  case "action":
    // handle action
    break;
  case "textGeneration":
    // handle text generation
    break;
  default: {
    const _exhaustiveCheck: never = generation.context.operationNode.content.type;
    throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
  }
}
```

**Fail Fast**

Validate inputs early and throw with actionable messages:
```typescript
if (!generation) {
  throw new Error(`Generation(id: ${generationId}) is not found`);
}

if (!config.vectorStoreQueryService) {
  throw new Error("No vector store query service provided");
}
```

### Feature Flags

Feature flags protect unreleased features, allowing safe merges to main and production deploys.

**Step 1: Define the flag in `apps/studio.giselles.ai/flags.ts`**

```typescript
export const myNewFeatureFlag = flag<boolean>({
  key: "my-new-feature",
  async decide() {
    if (process.env.NODE_ENV === "development") {
      return takeLocalEnv("MY_NEW_FEATURE_FLAG");
    }
    const edgeConfig = await get(`flag__${this.key}`);
    if (edgeConfig === undefined) {
      return false;
    }
    return edgeConfig === true || edgeConfig === "true";
  },
  description: "Enable my new feature",
  options: [
    { value: false, label: "disable" },
    { value: true, label: "Enable" },
  ],
  defaultValue: false,
});
```

**Step 2: Use on server (Next.js server components, data loaders)**

```typescript
// apps/studio.giselles.ai/app/workspaces/[workspaceId]/data-loader.ts
const myNewFeature = await myNewFeatureFlag();
return {
  // ...
  featureFlags: {
    // ...existing flags
    myNewFeature,
  },
};
```

**Step 3: Expose to React components**

Add the flag to the `FeatureFlagContextValue` interface:

```typescript
// packages/react/src/feature-flags/context.ts
export interface FeatureFlagContextValue {
  // ...existing flags
  myNewFeature: boolean;
}
```

Add to `WorkspaceProvider` defaults:

```typescript
// packages/react/src/workspace/provider.tsx
<FeatureFlagContext
  value={{
    // ...existing flags
    myNewFeature: featureFlag?.myNewFeature ?? false,
  }}
>
```

**Step 4: Use in React components**

```typescript
import { useFeatureFlag } from "@giselles-ai/react";

function MyComponent() {
  const { myNewFeature } = useFeatureFlag();
  
  if (!myNewFeature) {
    return null; // or fallback UI
  }
  
  return <NewFeatureUI />;
}
```

**Local development**: Set the environment variable (e.g., `MY_NEW_FEATURE_FLAG=true`) in `.env.local`.

**Production**: Configure via Vercel Edge Config with key `flag__my-new-feature`.

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
