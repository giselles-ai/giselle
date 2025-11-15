The GenerationRunnerSystem in this folder uses React Context for state management. When trying to render generation status streams, unrelated generation streams also trigger re-renders. To address this, we'll migrate to zustand so that components only re-render when there are updates to the specific generation they care about.

Migrating to zustand all at once would involve changing many files and carry significant risk, so we'll use the Strangler Fig Pattern to migrate gradually. To do this, we'll create a bridge layer that implements the current Context API using a zustand store as the backend.

You can reference packages/giselle/src/react/flow/zustand-bridge-provider.tsx and packages/giselle/src/react/flow/context.tsx in packages/giselle/src/react/flow as examples.
