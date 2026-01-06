# @giselles-ai/sdk

TypeScript SDK for running a Giselle App via the Studio public Runs API.

## Install

```sh
npm i @giselles-ai/sdk
```

## Environment

This SDK is intended for **server-side usage** (Node.js / server runtimes). Do not use secret keys in browsers.

## Usage

```ts
import Giselle from "@giselles-ai/sdk";

const client = new Giselle({
  // Secret key token (e.g. "gsk_xxx.yyy")
  apiKey: process.env.GISELLE_API_KEY,
});

async function main() {
	const { taskId } = await client.app.run({
		appId: "app-xxxxx",
		input: { text: "hello" },
	});
	return taskId;
}

main()
	.then((taskId) => console.log(taskId))
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
```

## API

### `new Giselle(options?)`

- `baseUrl?: string`
  - Optional. Defaults to `https://studio.giselles.ai`.
- `apiKey?: string`
  - Required. Sent as `Authorization: Bearer <token>`.
- `fetch?: typeof fetch`
  - Optional. Useful for tests and nonstandard runtimes.

### `client.app.run({ appId, input })`

Calls:

- `POST /api/apps/{appId}/run`
- Body: `{ "text": string }`
- Returns: `{ taskId: string }`

### `client.app.runAndWait(...)`

Present for future compatibility, but currently **throws** because the public task status/results API is not implemented yet.

## Current limitations

- **File input is not supported yet**: passing `input.file` throws an `UnsupportedFeatureError`.
- **`runAndWait` is not implemented yet**: use `app.run()` for now, then fetch task status/results via a future public API.

