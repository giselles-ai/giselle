# Giselle Cloud

https://studio.giselles.ai/

## Getting Started

> [!WARNING]
> It is difficult to start because there are many environment variables that need to be set.

## Required environment variables (API Publishing)

- **`GISELLE_API_SECRET_SCRYPT_N`**: scrypt N parameter (default: `16384`)
- **`GISELLE_API_SECRET_SCRYPT_R`**: scrypt r parameter (default: `8`)
- **`GISELLE_API_SECRET_SCRYPT_P`**: scrypt p parameter (default: `1`)
- **`GISELLE_API_SECRET_SCRYPT_KEY_LEN`**: derived key length (default: `32`)
- **`GISELLE_API_SECRET_SCRYPT_SALT_BYTES`**: salt size in bytes (default: `16`)
- **`GISELLE_API_SECRET_SCRYPT_LOG_DURATION`**: set to `1` to log scrypt duration to server logs (default: disabled)

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
