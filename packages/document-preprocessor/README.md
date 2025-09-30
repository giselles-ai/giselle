# @giselle-sdk/document-preprocessor

Utilities for turning raw document binaries into clean text and image payloads ready for RAG ingestion. Supports PDF, plain text, and Markdown formats with extensible APIs for future formats (PowerPoint, Excel, Word, …).

## Features

- **PDF processing**: Password-aware PDF parsing via [`@embedpdf/pdfium`](https://www.npmjs.com/package/@embedpdf/pdfium)
- **Text extraction**: Plain text and Markdown file support with configurable encoding
- Normalised text extraction with whitespace cleanup and hyphen repair
- Page-by-page PNG rendering using [`pngjs`](https://www.npmjs.com/package/pngjs) for PDFs
- Abort signal propagation so long-running conversions can be cancelled
- Strongly-typed results that surface per-page metadata for downstream chunking

## Installation

This package is published inside the monorepo under the `@giselle-sdk/*` namespace. It relies on optional native bindings shipped with PDFium, so make sure your runtime matches the supported Node.js versions (>=18).

## Usage

### Extract text from plain text or Markdown files

```ts
import { readFile } from "node:fs/promises";
import { extractText } from "@giselle-sdk/document-preprocessor";

const binary = await readFile("./document.md");
const { text } = extractText(binary, {
  encoding: "utf-8", // optional, defaults to utf-8
});

console.log(text);
```

### Extract text from a PDF

```ts
import { readFile } from "node:fs/promises";
import { extractPdfText } from "@giselle-sdk/document-preprocessor";

const binary = await readFile("./contract.pdf");
const { totalPages, pages } = await extractPdfText(binary, {
  password: process.env.PDF_PASSWORD,
  maxPages: 10,
});

for (const page of pages) {
  console.log(`# Page ${page.pageNumber}`);
  console.log(page.text);
}
```

### Render PDF pages to PNG

```ts
import { readFile } from "node:fs/promises";
import { renderPdfPageImages } from "@giselle-sdk/document-preprocessor";

const binary = await readFile("./whitepaper.pdf");
const { pages } = await renderPdfPageImages(binary, {
  targetDpi: 150,
  maxPages: 5,
  renderFormFields: true,
});

for (const page of pages) {
  await writeFile(`./page-${page.pageNumber}.png`, page.png);
}
```

### Aborting long-running work

All public APIs accept an optional `AbortSignal` to cancel ongoing work, which is useful for user-driven ingestion flows.

```ts
const abortController = new AbortController();
setTimeout(() => abortController.abort("timeout"), 5_000);

await extractPdfText(data, { signal: abortController.signal });
```

## API surface

| Function | Description |
| --- | --- |
| `extractText(input, options?)` | Extracts text from plain text or Markdown files with configurable encoding. |
| `extractPdfText(input, options?)` | Returns normalised text content for each PDF page. |
| `renderPdfPageImages(input, options?)` | Produces PNG buffers (RGB + alpha) per page at the requested DPI. |

### Type Exports

```ts
// Text extraction
export interface TextExtractionOptions {
  encoding?: BufferEncoding;
  signal?: AbortSignal;
}

export interface TextExtractionResult {
  text: string;
}

// PDF extraction
export interface PdfTextExtractionOptions {
  password?: string;
  maxPages?: number;
  signal?: AbortSignal;
}

export interface PdfTextExtractionResult {
  totalPages: number;
  pages: PdfTextPage[];
}

// PDF rendering
export interface PdfImageRenderOptions {
  password?: string;
  targetDpi?: number;
  maxPages?: number;
  signal?: AbortSignal;
  renderFormFields?: boolean;
}

export interface PdfImageRenderResult {
  totalPages: number;
  pages: PdfImagePage[];
}
```

## Roadmap

- Additional loaders for Office formats (PowerPoint, Excel, Word)
- Configurable image sampling heuristics (e.g. skip dense-text pages)
- Shared preprocessing utilities for chunk scheduling and modality tagging

## Development

```bash
pnpm -F @giselle-sdk/document-preprocessor test
pnpm -F @giselle-sdk/document-preprocessor check-types
pnpm -F @giselle-sdk/document-preprocessor build
```

Run Biome formatting after changes:

```bash
pnpm biome check --write packages/document-preprocessor
```

## Security Considerations

- **PDFium is sandboxed**: The PDFium engine is executed in a sandboxed environment to mitigate risks from malicious PDF files. However, always keep dependencies up to date and monitor for security advisories.
- **Password-protected PDFs**: Be cautious when processing password-protected or encrypted PDFs. The package may not fully support all encryption schemes, and handling such files could expose sensitive data if not managed securely.
- **File size and processing time limits**: To prevent denial-of-service attacks or resource exhaustion, enforce reasonable limits on input file size and processing time when using this package in production environments.
