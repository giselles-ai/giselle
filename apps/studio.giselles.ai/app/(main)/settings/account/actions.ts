"use server";

import { publicStorage } from "@/app/giselle-engine";
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
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { IMAGE_CONSTRAINTS } from "../constants";
import { deleteTeamMember } from "../team/actions";

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

export async function updateAvatar(formData: FormData) {
	try {
		const supabaseUser = await getUser();

		const file = formData.get("avatar") as File | null;
		if (!file) {
			throw new Error("Missing avatar file");
		}

		if (!IMAGE_CONSTRAINTS.formats.includes(file.type)) {
			throw new Error(
				"Invalid file format. Please upload a JPG, PNG, GIF, or WebP image.",
			);
		}

		if (file.size > IMAGE_CONSTRAINTS.maxSize) {
			throw new Error(
				`File size exceeds ${IMAGE_CONSTRAINTS.maxSize / (1024 * 1024)}MB limit`,
			);
		}

		const [currentUser] = await db
			.select({ avatarUrl: users.avatarUrl })
			.from(users)
			.innerJoin(
				supabaseUserMappings,
				eq(users.dbId, supabaseUserMappings.userDbId),
			)
			.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id));

		const ext = getExtensionFromMimeType(file.type);
		const filePath = `avatars/${supabaseUser.id}.${ext}`;

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		await publicStorage.setItemRaw(filePath, buffer, {
			contentType: file.type,
		});

		if (currentUser?.avatarUrl && currentUser.avatarUrl !== filePath) {
			try {
				// Extract file path from URL
				// From: https://xxx.supabase.co/storage/v1/object/public/public-assets/avatars/supabase-user-id.jpg
				// To: avatars/user-id.jpg
				const oldPath = currentUser.avatarUrl.split("/public-assets/")[1];

				if (oldPath) {
					await publicStorage.removeItem(oldPath);
					logger.debug("Old avatar file removed:", oldPath);
				}
			} catch (error) {
				// Don't fail the update if cleanup fails
				logger.error("Failed to remove old avatar:", error);
			}
		}

		const avatarUrl = await publicStorage.getItem(filePath, {
			publicURL: true,
		});
		if (typeof avatarUrl !== "string") {
			throw new Error("Failed to get avatar URL");
		}

		const userDbIdSubquery = db
			.select({ userDbId: supabaseUserMappings.userDbId })
			.from(supabaseUserMappings)
			.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id));

		await db
			.update(users)
			.set({ avatarUrl })
			.where(eq(users.dbId, userDbIdSubquery));

		revalidatePath("/settings/account");

		return {
			success: true,
			avatarUrl,
		};
	} catch (error) {
		logger.error("Failed to update avatar:", error);
		throw error;
	}
}
