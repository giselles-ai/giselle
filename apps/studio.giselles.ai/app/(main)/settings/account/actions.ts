"use server";

import { db, supabaseUserMappings, users } from "@/drizzle";
import { logger } from "@/lib/logger";
import { getUser } from "@/lib/supabase";
import {
	connectIdentity,
	disconnectIdentity,
	reconnectIdentity,
} from "@/services/accounts";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function connectGoogleIdentity() {
	return connectIdentity("google", "/settings/account");
}

export async function connectGitHubIdentity() {
	return connectIdentity("github", "/settings/account");
}

export async function reconnectGoogleIdentity() {
	return reconnectIdentity("google", "/settings/account");
}

export async function reconnectGitHubIdentity() {
	return reconnectIdentity("github", "/settings/account");
}

export async function disconnectGoogleIdentity() {
	return disconnectIdentity("google", "/settings/account");
}

export async function disconnectGitHubIdentity() {
	return disconnectIdentity("github", "/settings/account");
}

export async function getAccountInfo() {
	try {
		const supabaseUser = await getUser();

		const _users = await db
			.select({ displayName: users.displayName, email: users.email })
			.from(users)
			.innerJoin(
				supabaseUserMappings,
				eq(users.dbId, supabaseUserMappings.userDbId),
			)
			.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id));

		return _users[0];
	} catch (error) {
		logger.error("Failed to get account info:", error);
		throw error;
	}
}

export async function updateDisplayName(formData: FormData) {
	try {
		const supabaseUser = await getUser();

		if (!supabaseUser) {
			throw new Error("User not found");
		}

		const displayName = formData.get("displayName") as string;

		const userDbIdSubquery = db
			.select({ userDbId: supabaseUserMappings.userDbId })
			.from(supabaseUserMappings)
			.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id));

		await db
			.update(users)
			.set({ displayName })
			.where(eq(users.dbId, userDbIdSubquery));

		revalidatePath("/settings/account");

		return { success: true };
	} catch (error) {
		logger.error("Failed to update display name:", error);
		return { success: false, error };
	}
}
