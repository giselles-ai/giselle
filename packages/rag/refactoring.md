# Refactoring Rationale for `packages/rag`

## Why Refactoring Is Necessary
The current `packages/rag` module deviates from the "inevitable code" philosophy that guides the rest of the repository. Its public APIs obscure their dependencies, perform implicit environment access, and couple unrelated responsibilities into single sprawling functions. As a result, developers must read large sections of implementation code to understand how to configure or extend the package. This friction stands in contrast to adjacent packages whose interfaces are concise, composable, and easy to reason about.

Several pain points recur throughout the codebase:

- Embedding providers are instantiated inside pipeline and query helpers by reading environment variables directly. This prevents dependency injection, complicates testing, and forces consumers to reverse engineer how to swap providers.
- The vector-store layer uses layered wrappers and indirection to translate between column mappings, leading to duplicated logic in ingestion and query modules and hiding the actual SQL behavior.
- The ingestion pipeline bundles diffing, chunking, embedding, persistence, and cleanup into one function exceeding two hundred lines, which makes the control flow difficult to follow and reuse.

## Objectives of the Refactor
The goal is to replace `packages/rag` with a new `packages/retrieval` package that provides the same capabilities with designs that feel inevitable to the reader. The refactor will:

1. **Make dependencies explicit.** Embedders, chunkers, and vector stores will be injected through function parameters so callers can swap implementations without reading internal code.
2. **Collapse redundant abstractions.** The vector-store layer will expose a single `VectorStore` interface with direct column configuration, eliminating the duplicate mapping utilities and clarifying how SQL queries are generated.
3. **Distribute responsibilities.** Ingestion will be composed from focused utilities—diffing, embedding, storage—so the pipeline reads as an orchestration of obvious steps instead of a monolithic script.
4. **Match repository standards.** The new package will mirror the clarity and composability found in other `packages` modules, using TypeScript's inference and familiar JavaScript patterns to minimize decision points for consumers.

## Approach and Structure
The refactoring introduces `packages/retrieval` with five thin modules that can be combined as needed:

- **Embeddings:** `createEmbedder` accepts a profile description and an injected transport function. It hides batching and retry concerns while leaving environment configuration to the caller.
- **Chunking:** Chunk utilities remain simple functions so ingestion can accept any chunk source or strategy without ceremony.
- **Vector Store:** A `VectorStore` interface defines `upsert`, `remove`, `listVersions`, and `search`. A PostgreSQL implementation encapsulates all SQL generation in one place, configured via a straightforward `columns` object and optional metadata schema.
- **Ingestion:** `createIngestPipeline` wires together diffing, chunking, embedding, and storage. Supporting utilities like `createVersionTracker` and `embedChunks` live in dedicated files, making each step independently testable.
- **Search:** `createSearch` composes the embedder and vector store to provide query capabilities, keeping filtering and scoring logic localized.

This structure keeps external APIs obvious—each function signature shows exactly what it needs—while allowing sophisticated behavior behind the scenes. Complexity is pulled downward into implementation modules where it reduces cognitive load for consumers.

## Expected Outcomes
By replacing `packages/rag` with `packages/retrieval`, we expect the following improvements:

- Developers can understand and integrate retrieval features by reading concise entry points rather than tracing environment-dependent code paths.
- Testing and provider substitution become straightforward because embedders and stores are ordinary parameters instead of hidden singletons.
- Maintenance cost drops as ingestion and search logic are composed from reusable utilities, making changes localized and predictable.
- The package aligns with the inevitable code philosophy, offering interfaces that feel natural, unsurprising, and aligned with the rest of the repository.

The refactoring focuses on making the right design feel like the only design. Each module exposes inevitable interfaces, concentrates complexity where it belongs, and restores confidence that the retrieval stack operates exactly as the reader expects.
