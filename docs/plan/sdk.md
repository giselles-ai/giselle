# Giselle SDK

With `@giselles-ai/sdk`, you can run Apps created on `studio.giselles.ai` with an API similar to the OpenAI SDK.

```ts
import Giselle from "@giselles-ai/sdk";

const client = new Giselle({
  apiKey: process.env.GISELLE_API_KEY,
});

const { taskId } = await client.app.run({
  appId: "app-VC4zxzcdSrO0tGDY",
  input: { text: "your input here" },
});

console.log(taskId);
```

### Tasks

- [x] Implement `client.apps.list` to call `GET /api/apps` and return `{ apps: App[] }` (see [README](../../packages/sdk/README.md))
- [ ] In `studio.giselles.ai/tasks`, make it clear when a task execution originated from the public API (SDK).

### Done

- [x] Add file input support to `client.app.runAndWait()` via **either** a `fileId` (from the upload API) **or** an inline base64 file payload (with a size limit).
- [x] Add file upload support to the SDK.
- [x] Implement `client.app.run()` to call `POST /api/apps/{appId}/run` and return `{ taskId }`.
- [x] Implement `client.app.runAndWait()` by polling `GET /api/apps/{appId}/tasks/{taskId}` until the task reaches a terminal status.
- [x] On completion, fetch the final task result via `GET /api/apps/{appId}/tasks/{taskId}?includeGenerations=1` and return `{ steps, outputs }`.
- [x] Align Runs/Tasks authentication for Team secret keys (use `Authorization: Bearer <apiKeyId>.<secret>`; no token prefix).
- [x] Add SDK tests (mocked `fetch`) and document usage in `packages/sdk/README.md`.

### Changelog

- 2026-01-13 10:04:33 +0900: Created
