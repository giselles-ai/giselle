import {
	isJsonContent,
	jsonContentToText,
} from "@giselles-ai/text-editor-utils";

export function isPromptEmpty(prompt: string | undefined) {
	const text = isJsonContent(prompt)
		? jsonContentToText(JSON.parse(prompt))
		: prompt;
	const noWhitespaceText = text?.replace(/[\s\u3000]+/g, "");
	return !noWhitespaceText;
}
