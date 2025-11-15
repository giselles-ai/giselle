# ADR-0003: Managing Secrets

## Status
Implemented

## Context
We need to implement a secure mechanism to manage sensitive information that users register with Giselle, such as Personal Access Tokens (PATs) and, in the future, API keys for LLM providers. This requires a Vault (Secrets Manager) implementation.

## Decision
We have implemented a Vault system with the following design:

1. The Vault functionality is implemented in `@giselles-ai/giselle-engine` via the `vault` module.
2. It is specified as a configuration option for the GiselleEngine, with no default implementation.
3. The Vault provides encrypt and decrypt capabilities and supports multiple drivers through a common interface.

The core implementation includes:

```ts
// vault/types.ts
interface EncryptOptions {
  name?: string;
  description?: string;
}

export interface Vault {
  encrypt(plaintext: string, options?: EncryptOptions): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
}

export interface VaultDriver {
  encrypt(plaintext: string, options?: EncryptOptions): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
}

// vault/index.ts
export function createVault(driver: VaultDriver): Vault {
  return {
    encrypt: async (plaintext, options) => {
      return await driver.encrypt(plaintext, options);
    },
    decrypt: async (ciphertext: string) => {
      return await driver.decrypt(ciphertext);
    },
  };
}
```

We have implemented multiple driver options:

```ts
// Example using Supabase Vault Driver
const supabaseVault = supabaseVaultDriver({
  url: process.env.SUPABASE_URL,
  privateKey: process.env.SUPABASE_PRIVATE_KEY,
  tableName: "secrets", // optional, default is "secrets"
  encryptionKey: process.env.ENCRYPTION_KEY, // optional additional encryption layer
});
```

The Vault is specified when initializing the GiselleEngine:

```ts
export const giselleEngine = NextGiselleEngine({
  basePath: "/api/giselle",
  storage,
  vault: supabaseVault,
});
```

Usage pattern:

```ts
// Encrypt a secret (e.g., a GitHub PAT)
const plaintext = "github_pat_abc123xyz";
const encryptedSecret = await giselleEngine.encryptSecret(plaintext);

// React
const client = useGiselle()
const encryptedSecret = await client.encryptSecret({ plaintext })

// Later, decrypt the secret when needed(sever only)
const decryptedSecret = await giselleEngine.decryptSecret(encryptedSecret);

// Store only the encrypted reference in database
const userSecrets = {
  userId: "user123",
  githubTokenId: encryptedSecret,
};
```

## Consequences
### Positive
- Provides a secure way to store and manage sensitive user information.
- Flexible driver-based architecture allows for different storage backends.
- Separation of concerns with vault functionality contained in the engine.
- Multiple implementation options (Supabase, WebCrypto) for different environments.
- Simple API exposure through the GiselleEngine.
- When using Supabase Vault driver:
  - Secrets are encrypted at rest using Authenticated Encryption with Associated Data (AEAD)
  - Secrets remain encrypted in backups and replication streams
  - Encryption keys are stored separately from the database
  - Based on libsodium cryptographic library for strong security

### Negative
- Adds complexity to the codebase.
- Requires proper key management practices.
- Different vault drivers have different security characteristics.
- Supabase Vault is currently in Public Alpha status.
- Client-side only has access to encryption methods (decryption is server-side only).

### Risks
- Improper implementation could lead to security vulnerabilities.
- Key rotation and management need careful consideration.
- Storage of encryption keys requires secure practices.
- If using Supabase Vault, need to assess the security of their backend systems that store root encryption keys.
- Reliance on Supabase services for critical security functionality creates external dependency.
