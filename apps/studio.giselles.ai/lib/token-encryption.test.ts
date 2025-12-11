import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, test } from "vitest";
import { decryptToken, encryptToken } from "./token-encryption";

describe("token-encryption", () => {
	const testKey = randomBytes(32).toString("base64");

	beforeEach(() => {
		process.env.TOKEN_ENCRYPTION_KEY = testKey;
	});

	test("encrypts and decrypts token correctly", () => {
		const plaintext = "gho_xxxxxxxxxxxxxxxxxxxx";
		const encrypted = encryptToken(plaintext);
		const decrypted = decryptToken(encrypted);

		expect(decrypted).toBe(plaintext);
	});

	test("encrypted token starts with 'enc:' prefix", () => {
		const encrypted = encryptToken("test-token");

		expect(encrypted.startsWith("enc:")).toBe(true);
	});

	test("same plaintext produces different ciphertext each time", () => {
		const plaintext = "same-token";
		const encrypted1 = encryptToken(plaintext);
		const encrypted2 = encryptToken(plaintext);

		expect(encrypted1).not.toBe(encrypted2);
		expect(decryptToken(encrypted1)).toBe(plaintext);
		expect(decryptToken(encrypted2)).toBe(plaintext);
	});

	test("decrypts plaintext tokens as-is for backward compatibility", () => {
		const plaintext = "gho_plaintext_token";
		const result = decryptToken(plaintext);

		expect(result).toBe(plaintext);
	});

	test("throws error when decrypting tampered data", () => {
		const encrypted = encryptToken("test-token");
		const tampered = `${encrypted.slice(0, -4)}XXXX`;

		expect(() => decryptToken(tampered)).toThrow();
	});

	test("handles empty string", () => {
		const encrypted = encryptToken("");
		const decrypted = decryptToken(encrypted);

		expect(decrypted).toBe("");
	});

	test("handles unicode characters", () => {
		const plaintext = "token_日本語_🔐";
		const encrypted = encryptToken(plaintext);
		const decrypted = decryptToken(encrypted);

		expect(decrypted).toBe(plaintext);
	});

	test("handles long tokens", () => {
		const plaintext = "a".repeat(10000);
		const encrypted = encryptToken(plaintext);
		const decrypted = decryptToken(encrypted);

		expect(decrypted).toBe(plaintext);
	});

	describe("when encryption key is invalid", () => {
		test("throws error when encryption key is not set", () => {
			process.env.TOKEN_ENCRYPTION_KEY = "";

			expect(() => encryptToken("test")).toThrow(
				"TOKEN_ENCRYPTION_KEY is not set",
			);
		});

		test("throws error when encryption key is wrong length", () => {
			process.env.TOKEN_ENCRYPTION_KEY = randomBytes(16).toString("base64");

			expect(() => encryptToken("test")).toThrow(
				"TOKEN_ENCRYPTION_KEY must be 32 bytes",
			);
		});
	});
});
