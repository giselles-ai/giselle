import type { Generation, Message } from "@giselles-ai/protocol";

export function getAssistantTextFromGeneration(generation: Generation): string {
	if (!("messages" in generation) || generation.messages === undefined) {
		return "";
	}

	const assistantMessages = (generation.messages as Message[]).filter(
		(message) => message.role === "assistant",
	);

	return assistantMessages
		.map((message) =>
			message.parts
				?.filter((part) => part.type === "text")
				.map((part) => part.text)
				.join("\n"),
		)
		.filter(Boolean)
		.join("\n\n");
}
