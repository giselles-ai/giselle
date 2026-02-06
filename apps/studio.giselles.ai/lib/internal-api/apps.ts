"use server";

import type { AppId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { assertWorkspaceAccess } from "@/lib/assert-workspace-access";

export async function getApp(input: { appId: AppId }) {
	const app = await giselle.getApp(input);
	await assertWorkspaceAccess(app.workspaceId);
	return { app };
}

function isNoSuchKeyError(error: unknown) {
	return error instanceof Error && error.name === "NoSuchKey";
}

export async function saveApp(input: Parameters<typeof giselle.saveApp>[0]) {
	let existingApp: Awaited<ReturnType<typeof giselle.getApp>> | undefined;
	try {
		existingApp = await giselle.getApp({ appId: input.app.id });
	} catch (error) {
		if (!isNoSuchKeyError(error)) {
			throw error;
		}
		// App doesn't exist, verify access to the target workspace for new app creation
		await assertWorkspaceAccess(input.app.workspaceId);
		await giselle.saveApp(input);
	}

	if (existingApp) {
		// Update existing app, verify access to the existing workspace
		await assertWorkspaceAccess(existingApp.workspaceId);
		await giselle.saveApp({
			app: { ...input.app, workspaceId: existingApp.workspaceId },
		});
	}
}

export async function deleteApp(
	input: Parameters<typeof giselle.deleteApp>[0],
) {
	const app = await giselle.getApp(input);
	await assertWorkspaceAccess(app.workspaceId);
	await giselle.deleteApp(input);
}
