# Giselle Cloud

https://studio.giselles.ai/

## Getting Started

> [!WARNING]
> It is difficult to start because there are many environment variables that need to be set.

## Required environment variables (API Publishing)

- **`GISELLE_API_SECRET_PEPPER`**: Server-side pepper used to hash API Publishing secret keys (HMAC-SHA256).
  - Store this in **Vercel Environment Variables** (server-only) and in local `.env` for development.
  - Generate a high-entropy value (example):

```sh
openssl rand -base64 32
```

1. Set up your `.env` file
    1. Duplicate `.env.example` to `.env`.
    2. Please set the environment variables in the `.env` file.
2. Install dependencies

    ```sh
    pnpm install
    ```

3. Start developing and watch for code changes

    ```sh
    pnpm turbo dev
    ```
