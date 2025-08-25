"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
	db,
	supabaseUserMappings,
	type TeamRole,
	type UserId,
	users,
} from "@/drizzle";
import { updateGiselleSession } from "@/lib/giselle-session";
import { logger } from "@/lib/logger";
import { getUser } from "@/lib/supabase";
import {
	connectIdentity,
	disconnectIdentity,
	reconnectIdentity,
} from "@/services/accounts";
import { isTeamId } from "@/services/teams";
import { deleteTeamMember } from "../team/actions";
import {
	deleteAvatar,
	uploadAvatar,
	validateImageFile,
} from "../utils/avatar-upload";

export async function connectGoogleIdentity() {
	return await connectIdentity("google", "/settings/account/authentication");
}

export async function connectGitHubIdentity() {
	return await connectIdentity("github", "/settings/account/authentication");
}

export async function reconnectGoogleIdentity() {
	return await reconnectIdentity("google", "/settings/account/authentication");
}

export async function reconnectGitHubIdentity() {
	return await reconnectIdentity("github", "/settings/account/authentication");
}

export async function disconnectGoogleIdentity() {
	return await disconnectIdentity("google", "/settings/account/authentication");
}

export async function disconnectGitHubIdentity() {
	return await disconnectIdentity("github", "/settings/account/authentication");
}

export async function getAccountInfo() {
	try {
		const supabaseUser = await getUser();

		const [user] = await db
			.select({
				displayName: users.displayName,
				email: users.email,
				avatarUrl: users.avatarUrl,
			})
			.from(users)
			.innerJoin(
				supabaseUserMappings,
				eq(users.dbId, supabaseUserMappings.userDbId),
			)
			.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id));

		return user;
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
		revalidatePath("/", "layout");

		return { success: true };
	} catch (error) {
		logger.error("Failed to update display name:", error);
		return { success: false, error };
	}
}

export async function navigateWithChangeTeam(rawTeamId: string, path: string) {
	const teamId = isTeamId(rawTeamId) ? rawTeamId : null;
	if (!teamId) {
		throw new Error("Invalid team ID");
	}
	await updateGiselleSession({ teamId });
	redirect(path);
}

export async function leaveTeam(
	rawTeamId: string,
	rawUserId: string,
	rawRole: string,
) {
	const teamId = isTeamId(rawTeamId) ? rawTeamId : null;
	if (!teamId) {
		throw new Error("Invalid team ID");
	}
	const isUserId = (value: string): value is UserId => {
		return value.length > 0 && value.startsWith("usr_");
	};
	const userId = isUserId(rawUserId) ? rawUserId : null;
	if (!userId) {
		throw new Error("Invalid user ID");
	}

	const isRole = (value: string): value is TeamRole => {
		return value === "admin" || value === "member";
	};
	const role = isRole(rawRole.toLowerCase()) ? rawRole.toLowerCase() : null;
	if (!role) {
		console.error("Invalid role", rawRole);
		throw new Error("Invalid role");
	}

	await updateGiselleSession({ teamId });
	const formData = new FormData();
	formData.set("userId", userId);
	formData.set("role", role);
	const result = await deleteTeamMember(formData);

	if (result.success) {
		revalidatePath("/settings/account");
	}
	return result;
}

export async function updateAvatar(formData: FormData) {
	try {
		const supabaseUser = await getUser();

		const file = formData.get("avatar") as File | null;
		if (!file) {
			throw new Error("Missing avatar file");
		}

		// Validate the image file
		const validation = validateImageFile(file);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		const [currentUser] = await db
			.select({ avatarUrl: users.avatarUrl })
			.from(users)
			.innerJoin(
				supabaseUserMappings,
				eq(users.dbId, supabaseUserMappings.userDbId),
			)
			.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id));

		const avatarUrl = await uploadAvatar(file, "avatars", supabaseUser.id);
		const userDbIdSubquery = db
			.select({ userDbId: supabaseUserMappings.userDbId })
			.from(supabaseUserMappings)
			.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id));

		await db
			.update(users)
			.set({ avatarUrl })
			.where(eq(users.dbId, userDbIdSubquery));

		// Delete old avatar after successful DB update (failure is acceptable)
		if (currentUser?.avatarUrl) {
			try {
				await deleteAvatar(currentUser.avatarUrl);
			} catch (error) {
				// Log error but don't fail the request
				logger.error("Failed to delete old avatar:", error);
			}
		}

		revalidatePath("/settings/account");
		revalidatePath("/", "layout");

		return {
			success: true,
			avatarUrl,
		};
	} catch (error) {
		logger.error("Failed to update avatar:", error);
		throw error;
	}
}
