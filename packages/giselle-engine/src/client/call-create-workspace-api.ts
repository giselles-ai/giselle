import { Workspace } from "@giselle-sdk/data-type";
import { createWorkspace } from "../core/schema";

function getBaseUrl() {
	if (typeof window !== "undefined")
		// browser should use relative path
		return "";
	if (process.env.VERCEL_URL)
		// reference for vercel.com
		return `https://${process.env.VERCEL_URL}`;
	// assume localhost
	return `http://localhost:${process.env.PORT ?? 3000}`;
}

export async function callCreateWorkspaceApi({
	api = "/api/giselle/create-workspace",
}: {
	api?: string;
} = {}) {
	const response = await fetch(`${getBaseUrl()}${api}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({}),
	});
	const data = await response.json();
	const output = createWorkspace.Output.parse(data);
	return Workspace.parse(output.workspace);
}
