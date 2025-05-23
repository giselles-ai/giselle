# @giselle-sdk/web-search

A TypeScript library for scraping and extracting web page content as HTML and Markdown. Supports multiple providers, including Firecrawl (API-based) and a self-made (fetch + Turndown) implementation.

## Features
- Scrape web pages and extract content as HTML and/or Markdown
- Two providers:
  - **Firecrawl**: Uses the [@mendable/firecrawl-js](https://www.npmjs.com/package/@mendable/firecrawl-js) API
  - **SelfMade**: Uses native fetch and [Turndown](https://www.npmjs.com/package/turndown) for HTML-to-Markdown conversion
- Type-safe API using [zod](https://www.npmjs.com/package/zod)

## Installation

This package is intended for internal use within the Giselle monorepo. If you want to use it elsewhere, install dependencies:

```sh
pnpm install
```

## Usage

### Unified Interface

Create a web search tool by specifying the provider. Firecrawl requires an API key.

```ts
import { websearch } from "@giselle-sdk/web-search";

const firecrawlTool = websearch({ provider: "firecrawl", apiKey: "fc-..." });
const selfMadeTool = websearch({ provider: "self-made" });

const result = await firecrawlTool.fetchUrl("https://example.com", ["html"]);
console.log(result.html); // HTML content
```

Provider specific functions `firecrawlScrapeUrl` and `selfMadeScrapeUrl` are still exported if needed.

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

- `FIRECRAWL_API_KEY`: Required for Firecrawl provider.
- `VITEST_WITH_EXTERNAL_API=1`: (For testing) Enables tests that call the Firecrawl API.

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

To run tests that require the Firecrawl API, set the environment variable:

```sh
FIRECRAWL_API_KEY=your-key VITEST_WITH_EXTERNAL_API=1 pnpm test
```
