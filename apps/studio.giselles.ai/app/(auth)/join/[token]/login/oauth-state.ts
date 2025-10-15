import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";

const STATE_TTL_MS = 5 * 60 * 1000;

type InviteStatePayload = {
	invitationToken: string;
	invitedEmail: string;
	issuedAt: number;
};

function getStateSecret(): Buffer {
	const secret =
		process.env.INVITE_OAUTH_STATE_SECRET ?? process.env.SUPABASE_JWT_SECRET;
	if (!secret) {
		throw new Error("Missing OAuth state secret.");
	}
	const hash = createHash("sha256").update(secret).digest();
	return hash;
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
	const iv = buffer.subarray(0, 12);
	const authTag = buffer.subarray(12, 28);
	const encrypted = buffer.subarray(28);
	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(authTag);
	const decrypted = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]).toString("utf8");
	const payload = JSON.parse(decrypted) as InviteStatePayload;
	if (Date.now() - payload.issuedAt > STATE_TTL_MS) {
		throw new Error("The OAuth invitation state has expired.");
	}
	return payload;
}
