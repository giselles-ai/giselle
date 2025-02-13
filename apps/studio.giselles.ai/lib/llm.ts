export function langfuseModel(modelId: string) {
	switch (modelId) {
		case "gpt-4o":
			return "gpt-4o";
		case "gpt-4o-mini":
			return "gpt-4o-mini";
		case "claude-3.5-sonnet":
			return "claude-3-5-sonnet-20241022";
	}
}
