import type { VaultDriver } from "./types";

/**
 * No-op vault driver for tests where persistence is not required.
 */
export const noopVaultDriver: VaultDriver = {
	encrypt(plaintext) {
		return Promise.resolve(plaintext);
	},
	decrypt(ciphertext) {
		return Promise.resolve(ciphertext);
	},
};
