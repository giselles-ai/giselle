"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod/v4";
import { ApiKeyId } from "@/db/schema";
import { createApiSecret, revokeApiSecret } from "@/lib/api-keys";
import { getCurrentUser } from "@/lib/get-current-user";
import { fetchCurrentTeam } from "@/services/teams";

type CreateApiKeyActionState =
	| { ok: true; token: string }
	| { ok: false; error: string };

export type RevokeApiKeyActionState =
	| { ok: true }
	| { ok: false; error: string };

const createInputSchema = z.object({
	label: z.string().trim().max(128, "Name is too long").optional(),
});

export async function createApiKeyAction(
	_prevState: CreateApiKeyActionState | undefined,
	formData: FormData,
): Promise<CreateApiKeyActionState> {
	const rawLabel = formData.get("label");
	const label = typeof rawLabel === "string" ? rawLabel.trim() : "";

	const parsed = createInputSchema.safeParse({
		label: label === "" ? undefined : label,
	});
	if (!parsed.success) {
		return { ok: false, error: "Invalid input" };
	}

	const [team, user] = await Promise.all([
		fetchCurrentTeam(),
		getCurrentUser(),
	]);

	try {
		const result = await createApiSecret({
			teamDbId: team.dbId,
			createdByUserDbId: user.dbId,
			label: parsed.data.label ?? null,
		});
		revalidatePath("/settings/team/api-keys");
		return { ok: true, token: result.token };
	} catch (error) {
		console.error("createApiKeyAction failed", error);
		return { ok: false, error: "Failed to create API key" };
	}
}

export async function revokeApiKeyAction(
	_prevState: RevokeApiKeyActionState | undefined,
	formData: FormData,
): Promise<RevokeApiKeyActionState> {
	const rawApiKeyId = formData.get("apiKeyId");
	const parsed = ApiKeyId.safeParse(rawApiKeyId);
	if (!parsed.success) {
		return { ok: false, error: "Invalid API key ID" };
	}

	const team = await fetchCurrentTeam();

	try {
		const result = await revokeApiSecret({
			apiKeyId: parsed.data,
			teamDbId: team.dbId,
		});

		revalidatePath("/settings/team/api-keys");

		if (!result.revoked) {
			return {
				ok: false,
				error: "API key not found or already revoked",
			};
		}

		return { ok: true };
	} catch (error) {
		console.error("revokeApiKeyAction failed", error);
		return { ok: false, error: "Failed to revoke API key" };
	}
}
