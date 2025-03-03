import type { z } from "zod";
import { cancelGeneration } from "../core/schema";

const Input = cancelGeneration.Input;
type Input = z.infer<typeof Input>;
export async function callCancelGenerationApi({
	api = cancelGeneration.defaultApi,
	...input
}: {
	api?: string;
} & Input) {
	await fetch(api, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(cancelGeneration.Input.parse(input)),
	});
}
