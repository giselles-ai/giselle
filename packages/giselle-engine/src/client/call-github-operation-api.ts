// call-github-operation-api.ts (新しいファイル)
import type { z } from "zod";
import { githubOperation } from "../core/schema";

const Input = githubOperation.Input;
type Input = z.infer<typeof Input>;

export async function callGithubOperationApi(input: Input) {
	const response = await fetch("/api/giselle/github-operation", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(githubOperation.Input.parse(input)),
	});

	if (!response.ok) {
		throw new Error(`GitHub operation failed: ${response.statusText}`);
	}

	return response.json();
}
