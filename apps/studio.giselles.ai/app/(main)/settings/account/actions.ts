"use server";

import { storage } from "@/app/giselle-engine";
import {
	type TeamRole,
	type UserId,
	db,
	supabaseUserMappings,
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
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { IMAGE_CONSTRAINTS } from "../constants";
import { deleteTeamMember } from "../team/actions";

export async function connectGoogleIdentity() {
	return connectIdentity("google", "/settings/account/authentication");
}

export async function connectGitHubIdentity() {
	return connectIdentity("github", "/settings/account/authentication");
}

export async function reconnectGoogleIdentity() {
	return reconnectIdentity("google", "/settings/account/authentication");
}

export async function reconnectGitHubIdentity() {
	return reconnectIdentity("github", "/settings/account/authentication");
}

export async function disconnectGoogleIdentity() {
	return disconnectIdentity("google", "/settings/account/authentication");
}

export async function disconnectGitHubIdentity() {
	return disconnectIdentity("github", "/settings/account/authentication");
}

export async function getAccountInfo() {
	try {
		const supabaseUser = await getUser();

		const _users = await db
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

		const user = _users[0];
		const avatarUrl = user.avatarUrl
			? await getAvatarUrl(user.avatarUrl)
			: null;
		return {
			...user,
			avatarUrl,
		};
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

		revalidatePath("/settings/account/authentication");

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
	// FIXME: Current implementation requires current user to be an admin of the team. It's better to allow any user to leave the team.
	const result = await deleteTeamMember(formData);

	if (result.success) {
		revalidatePath("/settings/account");
	}
	return result;
}

function getExtensionFromMimeType(mimeType: string): string {
	return (
		IMAGE_CONSTRAINTS.mimeToExt[
			mimeType as keyof typeof IMAGE_CONSTRAINTS.mimeToExt
		] || "jpg"
	);
}

/**
 * Gets a cached avatar URL, either returning an external URL directly or generating a signed URL for Supabase storage
 *
 * @param path - The path to the avatar image (full URL for external sources, storage path for Supabase)
 * @returns A URL that can be used to display the avatar
 *
 * Note on timing:
 * - Signed URL is set to expire in 1 hour (3600 seconds)
 * - Cache is set to revalidate in 55 minutes (3300 seconds)
 * This 5-minute buffer ensures we generate a new signed URL before the current one expires
 */
const getAvatarUrl = unstable_cache(
	async (path: string): Promise<string> => {
		if (path.startsWith("https://")) {
			return path;
		}

		try {
			const signedUrl = await storage.getItem(path, {
				signedUrl: true,
				expiresIn: 60 * 60, // 1 hour expiry for signed URL
			});

			if (!signedUrl || typeof signedUrl !== "string") {
				throw new Error("Failed to generate signed URL");
			}

			return signedUrl;
		} catch (error) {
			logger.error("Failed to generate signed URL:", error);
			throw new Error("Failed to generate avatar URL");
		}
	},
	["avatar-url"],
	{
		revalidate: 55 * 60, // Revalidate cache after 55 minutes
		tags: ["avatar-url"],
	},
);

export async function updateAvatar(formData: FormData) {
	try {
		const user = await getUser();

		const file = formData.get("avatar") as File | null;
		if (!file) {
			throw new Error("Missing avatar file");
		}

		const [currentUser] = await db
			.select({ avatarUrl: users.avatarUrl })
			.from(users)
			.innerJoin(
				supabaseUserMappings,
				eq(users.dbId, supabaseUserMappings.userDbId),
			)
			.where(eq(supabaseUserMappings.supabaseUserId, user.id));

		const ext = getExtensionFromMimeType(file.type);
		const filePath = `avatars/${user.id}.${ext}`;

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		await storage.setItemRaw(filePath, buffer, {
			contentType: file.type,
		});

		if (currentUser?.avatarUrl && currentUser.avatarUrl !== filePath) {
			try {
				await storage.removeItem(currentUser.avatarUrl);
				logger.debug("Old avatar file removed:", currentUser.avatarUrl);
			} catch (error) {
				// Don't fail the update if cleanup fails
				logger.error("Failed to remove old avatar:", error);
			}
		}

		const userDbIdSubquery = db
			.select({ userDbId: supabaseUserMappings.userDbId })
			.from(supabaseUserMappings)
			.where(eq(supabaseUserMappings.supabaseUserId, user.id));

		await db
			.update(users)
			.set({ avatarUrl: filePath })
			.where(eq(users.dbId, userDbIdSubquery));

		revalidateTag("avatar-url");
		revalidatePath("/settings/account");

		const avatarUrl = await getAvatarUrl(filePath);

		return {
			success: true,
			avatarUrl,
		};
	} catch (error) {
		logger.error("Failed to update avatar:", error);
		throw error;
	}
}
