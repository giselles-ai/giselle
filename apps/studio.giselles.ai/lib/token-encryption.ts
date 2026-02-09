import {
	type CipherGCMTypes,
	createCipheriv,
	createDecipheriv,
	randomBytes,
} from "node:crypto";
import invariant from "tiny-invariant";

const ALGORITHM: CipherGCMTypes = "aes-256-gcm";
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;
const ENCRYPTED_PREFIX = "enc:"; // Prefix to identify encrypted tokens

function getEncryptionKey(): Buffer {
	const key = process.env.TOKEN_ENCRYPTION_KEY;
	invariant(key, "TOKEN_ENCRYPTION_KEY is not set");
	const buffer = Buffer.from(key, "base64");
	invariant(buffer.length === 32, "TOKEN_ENCRYPTION_KEY must be 32 bytes");
	return buffer;
}

function isEncrypted(value: string): boolean {
	return value.startsWith(ENCRYPTED_PREFIX);
}

export function encryptToken(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv, {
		authTagLength: AUTH_TAG_LENGTH,
	});

	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	// Format: enc:<base64(iv + authTag + encrypted)>
	const combined = Buffer.concat([iv, authTag, encrypted]);
	return `${ENCRYPTED_PREFIX}${combined.toString("base64")}`;
}

export function decryptToken(value: string): string {
	// Backward compatibility: return plaintext tokens as-is
	if (!isEncrypted(value)) {
		return value;
	}

	const key = getEncryptionKey();
	const data = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), "base64");

	if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
		throw new Error(
			"Encrypted token is malformed: insufficient data for IV and auth tag",
		);
	}
	const iv = data.subarray(0, IV_LENGTH);
	const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
	const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

	const decipher = createDecipheriv(ALGORITHM, key, iv, {
		authTagLength: AUTH_TAG_LENGTH,
	});
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]);
	return decrypted.toString("utf-8");
}
