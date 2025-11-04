# @giselle-ai/web-search

A TypeScript library for scraping and extracting web page content as HTML and Markdown. It uses a self-made (fetch + Turndown) implementation.

## Features
- Scrape web pages and extract content as HTML and/or Markdown
- Provider uses native fetch and [Turndown](https://www.npmjs.com/package/turndown) for HTML-to-Markdown conversion
- Type-safe API using [zod](https://www.npmjs.com/package/zod)

## Installation

This package is intended for internal use within the Giselle monorepo. If you want to use it elsewhere, install dependencies:

```sh
pnpm install
```

## Usage

### Unified Interface

Create a web search tool using the self-made provider.

```ts
import { webSearch } from "@giselle-ai/web-search";

const tool = webSearch({ provider: "self-made" });

const result = await tool.fetchUrl("https://example.com", ["html"]);
console.log(result.html); // HTML content
```

The provider specific function `selfMadeScrapeUrl` is also exported if needed.

## API

Both providers return an object:

```ts
{
  url: string;
  title: string;
  html: string;
  markdown: string;
}
```

- The `formats` argument is an array: `["html", "markdown"]`, `["html"]`, or `["markdown"]`.

## Environment Variables

- `VITEST_WITH_EXTERNAL_API=1`: (For testing) Enables tests that perform network requests.

## Development

- **Build:** `pnpm build`
- **Type Check:** `pnpm check-types`
- **Format:** `pnpm format`
- **Test:** `pnpm test`
- **Clean:** `pnpm clean`

## Testing

Uses [Vitest](https://vitest.dev/):

```sh
pnpm test
```

To run tests that require network access, set the environment variable:

```sh
VITEST_WITH_EXTERNAL_API=1 pnpm test
```
