import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";
import type { VaultDriver } from "@giselle-sdk/giselle-engine";

interface NodeVaultDriverConfig {
	/** Secret passphrase used to derive the encryption key */
	secret: string;
}

/**
 * Creates a simple vault driver using Node's crypto module.
 * It encrypts data with AES-256-GCM and returns ciphertext
 * formatted as `iv.authTag.ciphertext` in base64.
 */
export function nodeVaultDriver(config: NodeVaultDriverConfig): VaultDriver {
	const key = createHash("sha256").update(config.secret).digest();

	return {
		// biome-ignore lint/suspicious/useAwait: encryption is synchronous
		async encrypt(plaintext: string): Promise<string> {
			const iv = randomBytes(12);
			const cipher = createCipheriv("aes-256-gcm", key, iv);
			const encrypted = Buffer.concat([
				cipher.update(plaintext, "utf8"),
				cipher.final(),
			]);
			const tag = cipher.getAuthTag();

			return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
		},

		// biome-ignore lint/suspicious/useAwait: decryption is synchronous
		async decrypt(ciphertext: string): Promise<string> {
			const [ivB64, tagB64, dataB64] = ciphertext.split(".");
			if (!ivB64 || !tagB64 || !dataB64) {
				throw new Error("Invalid ciphertext format");
			}

			const iv = Buffer.from(ivB64, "base64");
			const tag = Buffer.from(tagB64, "base64");
			const data = Buffer.from(dataB64, "base64");
			const decipher = createDecipheriv("aes-256-gcm", key, iv);
			decipher.setAuthTag(tag);
			const decrypted = Buffer.concat([
				decipher.update(data),
				decipher.final(),
			]);

			return decrypted.toString("utf8");
		},
	};
}
