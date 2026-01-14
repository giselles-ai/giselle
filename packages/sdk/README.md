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
  // Secret key token (format: "<apiKeyId>.<secret>")
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

### Upload a file

Assuming `receipt.pdf` exists in the current directory:

```ts
import { File } from "node:buffer";
import { readFile } from "node:fs/promises";
import Giselle from "@giselles-ai/sdk";

const client = new Giselle({
	apiKey: process.env.GISELLE_API_KEY,
});

async function main() {
	const bytes = await readFile("./receipt.pdf");
	const file = new File([bytes], "receipt.pdf", { type: "application/pdf" });

	const { file: uploadedFile } = await client.files.upload({
		appId: "app-xxxxx",
		file,
	});

	return uploadedFile.id;
}

main()
	.then((fileId) => console.log(fileId))
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
- Body: `{ "text": string, "file"?: { "fileId": string } | { "base64": string, "name": string, "type": string } }`
- Returns: `{ taskId: string }`

### `client.app.runAndWait(...)`

Calls `POST /api/apps/{appId}/run`, then polls the task status API until the task finishes.

- Polls: `GET /api/apps/{appId}/tasks/{taskId}`
- Final fetch (includes generations): `GET /api/apps/{appId}/tasks/{taskId}?includeGenerations=1`
- Final response includes `task`, `steps`, `outputs` and `generationsById`.

### `client.files.upload({ appId, file, fileName? })`

Uploads a file to the App’s workspace (so it can later be referenced by `fileId` when file input support lands).

Calls:

- `POST /api/apps/{appId}/files/upload`
- Body: `multipart/form-data` (`file`, optional `fileName`)
- Returns: `{ file: UploadedFileData }`

## Current limitations

- **Inline base64 file size limit**: `input.file.base64` must decode to **<= 3MB**.
- **File reference requires metadata**: if you pass `input.file = { fileId }` for a file uploaded before metadata was persisted, the Runs API will return a `400` prompting you to re-upload.

