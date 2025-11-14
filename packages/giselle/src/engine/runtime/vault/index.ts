import type { Vault, VaultDriver } from "./types";

export * from "./types";

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
