"use server";

import {
	formDataRoutes,
	isFormDataRoutePath,
	isJsonRoutePath,
	jsonRoutes,
} from "@giselles-ai/http";
import { giselle } from "@/giselle";

const responseReturnPaths = new Set<string>(["streamTask"]);

async function unwrapInternalResponse(path: string, response: Response) {
	if (!response.ok) {
		let text = "";
		try {
			text = await response.text();
		} catch {
			// ignore
		}
		throw new Error(
			text ||
				`Giselle internal call failed: ${response.status} ${response.statusText}`,
		);
	}

	const contentType = response.headers.get("content-type");
	if (contentType?.includes("application/json")) {
		return await response.json();
	}

	if (responseReturnPaths.has(path)) {
		return response;
	}

	return;
}

export async function callGiselleInternal(path: string, input?: unknown) {
	if (isJsonRoutePath(path)) {
		const response = await jsonRoutes[path](giselle)({
			// @ts-expect-error: we intentionally accept `unknown` input at the boundary
			input,
			context: giselle.getContext(),
		});
		return await unwrapInternalResponse(path, response);
	}

	if (isFormDataRoutePath(path)) {
		const response = await formDataRoutes[path](giselle)({
			// @ts-expect-error: we intentionally accept `unknown` input at the boundary
			input,
			context: giselle.getContext(),
		});
		return await unwrapInternalResponse(path, response);
	}

	throw new Error(`Unknown Giselle internal route: ${path}`);
}
