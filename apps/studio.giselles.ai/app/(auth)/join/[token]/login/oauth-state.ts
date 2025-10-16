import {
	createCipheriv,
	createDecipheriv,
	pbkdf2Sync,
	randomBytes,
} from "node:crypto";

const STATE_TTL_MS = 5 * 60 * 1000;

type InviteStatePayload = {
	invitationToken: string;
	invitedEmail: string;
	issuedAt: number;
};

function getStateSecret(): Buffer {
	const secret = process.env.INVITE_OAUTH_STATE_SECRET;
	if (!secret) {
		throw new Error("Missing INVITE_OAUTH_STATE_SECRET environment variable.");
	}
	const saltEnv = process.env.INVITE_OAUTH_STATE_SALT;
	if (!saltEnv) {
		throw new Error("Missing INVITE_OAUTH_STATE_SALT environment variable.");
	}
	const salt = Buffer.from(saltEnv);
	// Derive an AES-256 key with PBKDF2 to slow down brute-force attempts.
	const key = pbkdf2Sync(secret, salt, 100_000, 32, "sha256");
	return key;
}

export function encodeInviteState(payload: {
	invitationToken: string;
	invitedEmail: string;
}): string {
	const key = getStateSecret();
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const invitePayload: InviteStatePayload = {
		invitationToken: payload.invitationToken,
		invitedEmail: payload.invitedEmail,
		issuedAt: Date.now(),
	};
	const serialized = JSON.stringify(invitePayload);
	const encrypted = Buffer.concat([
		cipher.update(serialized, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();
	const packet = Buffer.concat([iv, authTag, encrypted]);
	return packet.toString("base64url");
}

export function decodeInviteState(state: string): InviteStatePayload {
	const key = getStateSecret();
	const buffer = Buffer.from(state, "base64url");
	if (buffer.length < 28) {
		throw new Error("Invalid OAuth state: buffer too short.");
	}
	const iv = buffer.subarray(0, 12);
	const authTag = buffer.subarray(12, 28);
	const encrypted = buffer.subarray(28);
	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(authTag);
	const decrypted = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]).toString("utf8");
	const parsed = JSON.parse(decrypted);
	if (parsed == null || typeof parsed !== "object") {
		throw new Error("Invalid OAuth state: malformed payload.");
	}
	const candidate = parsed as Record<string, unknown>;
	const invitationToken = candidate.invitationToken;
	const invitedEmail = candidate.invitedEmail;
	const issuedAt = candidate.issuedAt;
	if (
		typeof invitationToken !== "string" ||
		typeof invitedEmail !== "string" ||
		typeof issuedAt !== "number"
	) {
		throw new Error("Invalid OAuth state: malformed payload.");
	}
	const payload: InviteStatePayload = {
		invitationToken,
		invitedEmail,
		issuedAt,
	};
	const now = Date.now();
	if (payload.issuedAt > now) {
		throw new Error("Invalid OAuth state: issuedAt is in the future.");
	}
	if (now - payload.issuedAt > STATE_TTL_MS) {
		throw new Error("The OAuth invitation state has expired.");
	}
	return payload;
}
