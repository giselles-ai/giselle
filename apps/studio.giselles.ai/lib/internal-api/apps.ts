"use server";

import type { AppId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";

export async function getApp(input: { appId: AppId }) {
	const app = await giselle.getApp(input);
	return { app };
}

export async function saveApp(input: Parameters<typeof giselle.saveApp>[0]) {
	await giselle.saveApp(input);
}

export async function deleteApp(
	input: Parameters<typeof giselle.deleteApp>[0],
) {
	await giselle.deleteApp(input);
}
